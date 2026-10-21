from typing import Optional, Tuple
import numpy as np
from PIL import Image
import torch
import torch.nn as nn
import torch.nn.functional as F


def apply_jet_colormap(heatmap: np.ndarray) -> np.ndarray:
    """Pure NumPy implementation of the standard Jet colormap."""
    # Red: clamp(1.5 - |4x - 3|, 0, 1)
    # Green: clamp(1.5 - |4x - 2|, 0, 1)
    # Blue: clamp(1.5 - |4x - 1|, 0, 1)
    r = np.clip(1.5 - np.abs(4.0 * heatmap - 3.0), 0.0, 1.0)
    g = np.clip(1.5 - np.abs(4.0 * heatmap - 2.0), 0.0, 1.0)
    b = np.clip(1.5 - np.abs(4.0 * heatmap - 1.0), 0.0, 1.0)
    rgb = np.stack([r, g, b], axis=-1)
    return (rgb * 255.0).astype(np.uint8)


class GradCAMExplainer:
    def __init__(self, model: nn.Module, target_layer: nn.Module):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        self._hooks = []
        self._register_hooks()

    def _register_hooks(self):
        def forward_hook(module, input, output):
            self.activations = output

        def backward_hook(module, grad_input, grad_output):
            self.gradients = grad_output[0]

        self._hooks.append(self.target_layer.register_forward_hook(forward_hook))
        self._hooks.append(self.target_layer.register_full_backward_hook(backward_hook))

    def generate_heatmap(
        self, input_tensor: torch.Tensor, target_class_idx: Optional[int] = None
    ) -> np.ndarray:
        self.model.eval()
        self.model.zero_grad()

        # Requires grad on input tensor for backprop
        input_tensor.requires_grad_(True)
        output = self.model(input_tensor)

        if target_class_idx is None:
            target_class_idx = int(torch.argmax(output, dim=1).item())

        score = output[0, target_class_idx]
        score.backward(retain_graph=True)

        if self.gradients is None or self.activations is None:
            return np.zeros((7, 7), dtype=np.float32)

        gradients = self.gradients.detach()
        activations = self.activations.detach()

        # Global average pooling of gradients: (batch, channels, 1, 1)
        weights = torch.mean(gradients, dim=(2, 3), keepdim=True)

        # Weighted combination of activation maps
        cam = torch.sum(weights * activations, dim=1).squeeze(0)
        cam = F.relu(cam)

        cam_np = cam.cpu().numpy()

        cam_min, cam_max = float(np.min(cam_np)), float(np.max(cam_np))
        if cam_max - cam_min > 1e-8:
            heatmap = (cam_np - cam_min) / (cam_max - cam_min)
        else:
            heatmap = np.zeros_like(cam_np)

        return heatmap

    def overlay_on_image(
        self, original_image: Image.Image, heatmap: np.ndarray, alpha: float = 0.5
    ) -> Image.Image:
        orig = original_image.convert("RGB")
        w, h = orig.size

        # Resize heatmap to original image size
        heatmap_pil = Image.fromarray((heatmap * 255.0).astype(np.uint8)).resize(
            (w, h), Image.Resampling.BILINEAR
        )
        heatmap_resized_norm = np.array(heatmap_pil).astype(np.float32) / 255.0

        # Apply Jet colormap
        colored_np = apply_jet_colormap(heatmap_resized_norm)
        colored_pil = Image.fromarray(colored_np, mode="RGB")

        # Blend
        blended = Image.blend(orig, colored_pil, alpha=alpha)
        return blended

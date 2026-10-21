"""
Grad-CAM (Gradient-Weighted Class Activation Mapping) Explainer
AgriGuard Research Project (J26-IT-420 - SLIIT)

Generates visual explainability heatmaps showing image regions contributing to
the neural network's disease classification decision.
"""

import io
import base64
from typing import Optional, Tuple
import numpy as np
from PIL import Image
import cv2
import torch
import torch.nn as nn
import torch.nn.functional as F

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
        self,
        input_tensor: torch.Tensor,
        target_class_idx: Optional[int] = None
    ) -> np.ndarray:
        """
        Computes 2D normalized Grad-CAM activation map [0, 1].
        """
        self.model.eval()
        self.model.zero_grad()

        output = self.model(input_tensor)

        if target_class_idx is None:
            target_class_idx = int(torch.argmax(output, dim=1).item())

        score = output[0, target_class_idx]
        score.backward(retain_graph=True)

        gradients = self.gradients.detach()
        activations = self.activations.detach()

        # Global average pooling of gradients: (batch, channels, 1, 1)
        weights = torch.mean(gradients, dim=(2, 3), keepdim=True)

        # Weighted combination of activation maps
        cam = torch.sum(weights * activations, dim=1).squeeze(0)
        cam = F.relu(cam)

        cam_np = cam.cpu().numpy()

        # Normalize to [0, 1]
        cam_min, cam_max = np.min(cam_np), np.max(cam_np)
        if cam_max - cam_min > 1e-8:
            heatmap = (cam_np - cam_min) / (cam_max - cam_min)
        else:
            heatmap = np.zeros_like(cam_np)

        return heatmap

    def overlay_on_image(
        self,
        original_image: Image.Image,
        heatmap: np.ndarray,
        alpha: float = 0.5,
        colormap: int = cv2.COLORMAP_JET
    ) -> Image.Image:
        """
        Overlays the Grad-CAM heatmap onto the original RGB PIL image.
        """
        orig_np = np.array(original_image.convert("RGB"))
        h, w, _ = orig_np.shape

        # Resize heatmap to match original image dimensions
        resized_cam = cv2.resize(heatmap, (w, h), interpolation=cv2.INTER_LINEAR)

        # Convert to 8-bit image and apply colormap
        heatmap_uint8 = np.uint8(255 * resized_cam)
        heatmap_colored = cv2.applyColorMap(heatmap_uint8, colormap)
        # Convert BGR (cv2 default) to RGB
        heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)

        # Alpha blend original image with colored heatmap
        blended = cv2.addWeighted(orig_np, 1.0 - alpha, heatmap_colored, alpha, 0)
        return Image.fromarray(blended)

    def generate_and_overlay(
        self,
        input_tensor: torch.Tensor,
        original_image: Image.Image,
        target_class_idx: Optional[int] = None
    ) -> Tuple[Image.Image, np.ndarray]:
        """
        Generates heatmap and returns (overlay_pil_image, raw_2d_heatmap).
        """
        heatmap = self.generate_heatmap(input_tensor, target_class_idx)
        overlay = self.overlay_on_image(original_image, heatmap)
        return overlay, heatmap

    def close(self):
        """Remove hooks to prevent memory leaks."""
        for hook in self._hooks:
            hook.remove()
        self._hooks.clear()

def image_to_base64_png(img: Image.Image) -> str:
    """Encodes PIL image to Base64 PNG string."""
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")

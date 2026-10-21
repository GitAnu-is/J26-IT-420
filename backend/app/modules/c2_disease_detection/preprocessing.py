import io
from PIL import Image
import torch
from torchvision import transforms

from app.core.exceptions import ValidationError

# ImageNet standard normalization parameters
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

inference_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])


def validate_and_load_image(image_bytes: bytes) -> Image.Image:
    """Validate image bytes format and dimensions, returning PIL RGB Image."""
    if not image_bytes or len(image_bytes) < 16:
        raise ValidationError("Invalid image: File buffer is empty or missing")

    if len(image_bytes) > 8 * 1024 * 1024:
        raise ValidationError("Uploaded image exceeds maximum allowed size of 8 MB")

    try:
        image = Image.open(io.BytesIO(image_bytes))
        image.load()
    except Exception:
        raise ValidationError("Unsupported image file type. Only genuine JPEG, PNG, and WebP images are accepted.")

    # Format check
    fmt = (image.format or "").upper()
    if fmt not in ["JPEG", "JPG", "PNG", "WEBP"]:
        raise ValidationError("Unsupported image file type. Only genuine JPEG, PNG, and WebP images are accepted.")

    # Dimension check: minimum 32x32 required for computer vision models
    width, height = image.size
    if width < 32 or height < 32:
        raise ValidationError(f"Image dimensions ({width}x{height}) are too small. Minimum required: 32x32.")

    # Convert to standard RGB
    if image.mode != "RGB":
        image = image.convert("RGB")

    return image


def prepare_tensor(image: Image.Image) -> torch.Tensor:
    """Transform PIL Image to normalized PyTorch batch tensor [1, 3, 224, 224]."""
    tensor = inference_transform(image)
    return tensor.unsqueeze(0)

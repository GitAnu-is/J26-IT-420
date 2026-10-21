"""
Image Preprocessing and Validation Pipeline for Deep Learning
AgriGuard Research Project (J26-IT-420 - SLIIT)

Implements safe image ingestion, validation, EXIF normalization, and tensor conversion.
"""

import io
from typing import Tuple, Union
import numpy as np
from PIL import Image, ImageOps
import torch
import torchvision.transforms as T

# Standard ImageNet normalization parameters for EfficientNet-B0 and ResNet50
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]
TARGET_IMAGE_SIZE = (224, 224)

# Inference transform pipeline
INFERENCE_TRANSFORMS = T.Compose([
    T.Resize(TARGET_IMAGE_SIZE, interpolation=T.InterpolationMode.BILINEAR),
    T.ToTensor(),
    T.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)
])

# Training data augmentation pipeline
TRAINING_TRANSFORMS = T.Compose([
    T.Resize((256, 256), interpolation=T.InterpolationMode.BILINEAR),
    T.RandomCrop(TARGET_IMAGE_SIZE),
    T.RandomHorizontalFlip(p=0.5),
    T.RandomVerticalFlip(p=0.2),
    T.RandomRotation(degrees=15),
    T.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.15),
    T.ToTensor(),
    T.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)
])

# Supported image format magic bytes
MAGIC_NUMBERS = {
    "jpeg": b"\xff\xd8\xff",
    "png": b"\x89PNG\r\n\x1a\n",
    "webp_riff": b"RIFF"
}

def validate_image_bytes(image_bytes: bytes) -> str:
    """
    Validates image bytes using magic headers and Pillow verification.
    Returns detected format ('jpeg', 'png', 'webp').
    Raises ValueError on invalid/corrupted data.
    """
    if not image_bytes or len(image_bytes) < 16:
        raise ValueError("Image data is empty or too short to be a valid file")

    # Magic byte verification
    is_jpeg = image_bytes.startswith(MAGIC_NUMBERS["jpeg"])
    is_png = image_bytes.startswith(MAGIC_NUMBERS["png"])
    is_webp = image_bytes.startswith(MAGIC_NUMBERS["webp_riff"]) and b"WEBP" in image_bytes[8:16]

    if not (is_jpeg or is_png or is_webp):
        raise ValueError("Unsupported or invalid image file format. Supported formats: JPEG, PNG, WebP.")

    # Integrity verification with PIL
    try:
        with Image.open(io.BytesIO(image_bytes)) as img:
            img.verify()
            width, height = img.size
            if width < 32 or height < 32:
                raise ValueError(f"Image dimensions ({width}x{height}) are too small. Minimum required: 32x32.")
            if width > 6000 or height > 6000:
                raise ValueError(f"Image dimensions ({width}x{height}) exceed maximum allowed dimensions (6000x6000).")
    except Exception as e:
        if isinstance(e, ValueError):
            raise
        raise ValueError(f"Corrupted or unreadable image file: {str(e)}")

    if is_jpeg:
        return "jpeg"
    elif is_png:
        return "png"
    return "webp"

def load_and_preprocess_image(
    image_source: Union[bytes, str, Image.Image]
) -> Tuple[torch.Tensor, Image.Image]:
    """
    Safely loads, validates, applies EXIF transposition, converts to RGB,
    and returns (preprocessed_tensor, rgb_pil_image).
    """
    if isinstance(image_source, bytes):
        validate_image_bytes(image_source)
        pil_img = Image.open(io.BytesIO(image_source))
    elif isinstance(image_source, str):
        with open(image_source, "rb") as f:
            data = f.read()
        validate_image_bytes(data)
        pil_img = Image.open(io.BytesIO(data))
    elif isinstance(image_source, Image.Image):
        pil_img = image_source
    else:
        raise ValueError(f"Unsupported image input type: {type(image_source)}")

    # Apply EXIF rotation if present
    try:
        pil_img = ImageOps.exif_transpose(pil_img)
    except Exception:
        pass

    # Ensure RGB
    if pil_img.mode != "RGB":
        pil_img = pil_img.convert("RGB")

    # Clone for return so caller has pure original RGB
    rgb_img = pil_img.copy()

    # Preprocess tensor (1, 3, 224, 224)
    tensor = INFERENCE_TRANSFORMS(rgb_img)
    tensor = tensor.unsqueeze(0)

    return tensor, rgb_img

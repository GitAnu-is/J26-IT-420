from typing import List, Dict, Any

# User Roles
class ROLES:
    FARMER = "FARMER"
    AGRICULTURAL_OFFICER = "AGRICULTURAL_OFFICER"
    RESEARCHER = "RESEARCHER"
    LOGISTICS_OPERATOR = "LOGISTICS_OPERATOR"
    TRANSPORT_OPERATOR = "TRANSPORT_OPERATOR"
    ADMIN = "ADMIN"

ALL_ROLES = [
    ROLES.FARMER,
    ROLES.AGRICULTURAL_OFFICER,
    ROLES.RESEARCHER,
    ROLES.LOGISTICS_OPERATOR,
    ROLES.TRANSPORT_OPERATOR,
    ROLES.ADMIN,
]


# Supported Crops
SUPPORTED_CROPS: List[str] = ["BANANA", "PINEAPPLE", "BLACK_PEPPER"]

# Standard Error Codes
class ERROR_CODES:
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    ACCOUNT_INACTIVE = "ACCOUNT_INACTIVE"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    TOKEN_INVALID = "TOKEN_INVALID"
    DUPLICATE_EMAIL = "DUPLICATE_EMAIL"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    FORBIDDEN = "FORBIDDEN"
    UNAUTHORIZED = "UNAUTHORIZED"
    CONFLICT = "CONFLICT"
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"

# Research Provenance Metadata
RESEARCH_PROVENANCE: Dict[str, Any] = {
    "platform": "AgriGuard",
    "project": "AI-Powered Smart Agriculture Platform for Minimizing Post-Harvest Crop Losses",
    "researchGroup": "J26-IT-420",
    "institution": "Sri Lanka Institute of Information Technology (SLIIT)",
    "architecture": "Unified FastAPI Modular Monolith",
    "components": {
        "C1": {
            "title": "AI-Based Crop Recommendation and Harvest Planning System",
            "models": ["Random Forest Classifier", "Random Forest Regressor"],
            "status": "active",
        },
        "C2": {
            "title": "AI-Based Plant Disease Detection and Severity Assessment System",
            "models": ["EfficientNet-B0 (Transfer Learning)", "ResNet50", "Grad-CAM"],
            "status": "active",
        },
        "C4": {
            "title": "AI-Based Transportation Risk Prediction and Smart Packaging Recommendation System",
            "models": ["Tree Ensemble (Gradient Boosting / Random Forest)", "SHAP TreeExplainer"],
            "status": "active",
        },
    },
}

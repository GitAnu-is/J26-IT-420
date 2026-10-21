# Legacy Microservices Notice — Phase 9 Migration

> **IMPORTANT ARCHITECTURAL NOTICE (AgriGuard Phase 9 - J26-IT-420)**
>
> As part of **Phase 9: Unified Modular Monolith Backend Migration**, all active research components:
> - **C1 Crop Recommendation & Harvest Planning** (formerly port 8001)
> - **C2 Plant Disease Detection & Grad-CAM** (formerly port 8002)
> - **C4 Transportation Risk & Smart Packaging** (formerly port 8003)
>
> have been consolidated into the unified **FastAPI Modular Monolith** located at:
> `backend/app/` operating on single public port **8000**.
>
> The source code and model artifacts in this directory are preserved for historical provenance, research validation, and rollback reference. They are no longer part of the active startup path (`start-all.ps1` / `start-all.sh`).

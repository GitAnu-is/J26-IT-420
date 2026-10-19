# Legacy Express Backend Notice — Phase 9 Migration

> **IMPORTANT ARCHITECTURAL NOTICE (AgriGuard Phase 9 - J26-IT-420)**
>
> As part of **Phase 9: Unified Modular Monolith Backend Migration**, the Node.js Express backend (formerly port 5000) has been fully migrated to the **FastAPI Modular Monolith** located at:
> `backend/app/` operating on single public port **8000**.
>
> All authentication logic, JWT token lifecycles, role-based access control, farm management, agricultural records, and MongoDB persistence have been migrated with 100% contract compatibility.
>
> This Express source directory (`backend/src/`) is preserved for reference, verification, and rollback safety. It is superseded by `backend/app/` in active deployment.

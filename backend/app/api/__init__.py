# API routes module
from fastapi import APIRouter
from .analyze import router as analyze_router
from .questions import router as questions_router
from .confirm import router as confirm_router
from .treatment import router as treatment_router

api_router = APIRouter()

api_router.include_router(analyze_router, tags=["Analysis"])
api_router.include_router(questions_router, tags=["Questions"])
api_router.include_router(confirm_router, tags=["Confirmation"])
api_router.include_router(treatment_router, tags=["Treatment"])

__all__ = ["api_router"]

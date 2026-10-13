from fastapi import APIRouter
from app.services.role_matching_service import get_role_catalog

router = APIRouter()

@router.get("/roles")
def get_roles():
    return get_role_catalog()

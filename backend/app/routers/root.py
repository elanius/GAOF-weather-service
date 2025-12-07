from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def read_root():
    return {"description": "Weather service for GAOF zones"}

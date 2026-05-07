from fastapi import APIRouter, HTTPException

from models.schemas import ShoppingRequest, ShoppingResponse
from services.openai_service import generate_shopping_list

router = APIRouter(prefix="/api/shopping", tags=["shopping"])


@router.post("/generate", response_model=ShoppingResponse)
async def get_shopping_list(req: ShoppingRequest):
    if not req.design_brief:
        raise HTTPException(status_code=400, detail="design_brief is required")

    try:
        items = await generate_shopping_list(
            design_brief=req.design_brief,
            room_type=req.room_type,
            style=req.style,
            budget_nis=req.budget_nis,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Shopping list generation failed: {str(e)}")

    total_essential = sum(i.estimated_price_nis for i in items if i.priority == "essential")
    total_recommended = sum(i.estimated_price_nis for i in items if i.priority == "recommended")
    total_optional = sum(i.estimated_price_nis for i in items if i.priority == "optional")

    return ShoppingResponse(
        items=items,
        total_essential=total_essential,
        total_recommended=total_recommended,
        total_optional=total_optional,
        within_budget=total_essential <= req.budget_nis,
        budget_nis=req.budget_nis,
    )

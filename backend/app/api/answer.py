from fastapi import APIRouter, Depends, HTTPException
from backend.app.models.answer import AnswerRequest, AnswerResponse
from backend.app.services.answer_service import AnswerService, get_answer_service

router = APIRouter(prefix="/api", tags=["Grounded QA"])


@router.post("/answer", response_model=AnswerResponse)
async def answer_question(
    request: AnswerRequest,
    answer_service: AnswerService = Depends(get_answer_service)
) -> AnswerResponse:
    """
    Generates a grounded natural language answer to a user's question,
    citing specific message IDs and refusing unanswerable questions.
    """
    try:
        response = await answer_service.answer_question(request)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Answer generation failed: {str(e)}"
        )

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from backend.app.models.summary import SummaryRequest, SummaryResponse
from backend.app.services.summary_service import SummaryService, get_summary_service

router = APIRouter(prefix="/api", tags=["Summaries"])


@router.post("/summarize", response_model=SummaryResponse)
async def summarize_conversation(
    request: SummaryRequest,
    summary_service: SummaryService = Depends(get_summary_service)
) -> SummaryResponse:
    """
    Summarizes conversation segments by topic, time-range, or sample,
    extracting key decisions, action items, assignees, and timeline dates.
    """
    try:
        response = await summary_service.summarize(request)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Summarization failed: {str(e)}"
        )


@router.get("/topics", response_model=List[str])
async def get_suggested_topics(
    summary_service: SummaryService = Depends(get_summary_service)
) -> List[str]:
    """Returns popular discovered topics across the conversation dataset."""
    return summary_service.get_suggested_topics()

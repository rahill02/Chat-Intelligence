from fastapi import APIRouter, Depends, HTTPException, Query
from backend.app.models.search import SearchRequest, SearchResponse
from backend.app.models.message import MessageWithContext
from backend.app.services.search_service import SearchService, get_search_service

router = APIRouter(prefix="/api", tags=["Search"])


@router.post("/search", response_model=SearchResponse)
async def search_messages(
    request: SearchRequest,
    search_service: SearchService = Depends(get_search_service)
) -> SearchResponse:
    """
    Performs intelligent search across messages with query understanding,
    FAISS multilingual vector retrieval, metadata filtering, explainable hybrid ranking,
    and conversational context thread hydration.
    """
    try:
        response = search_service.search(
            query=request.query,
            conversation_id=request.conversation_id,
            sender=request.sender,
            start_date=request.start_date,
            end_date=request.end_date,
            top_k=request.top_k,
            min_score=request.min_score,
            include_context=request.include_context,
            context_window=request.context_window
        )
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {str(e)}"
        )


@router.get("/messages/{message_id}/context", response_model=MessageWithContext)
async def get_message_context(
    message_id: str,
    window: int = Query(default=3, ge=1, le=15, description="Number of context messages before and after"),
    search_service: SearchService = Depends(get_search_service)
) -> MessageWithContext:
    """
    Fetches a message by its ID along with its surrounding conversational context (±window messages).
    """
    context = search_service.get_message_context(message_id, window=window)
    if not context:
        raise HTTPException(status_code=404, detail=f"Message with ID {message_id} not found")
    return context



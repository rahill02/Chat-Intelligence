from fastapi import APIRouter, Depends, HTTPException
from backend.app.models.search import SearchRequest, SearchResponse
from backend.app.services.search_service import SearchService, get_search_service

router = APIRouter(prefix="/api", tags=["Search"])


@router.post("/search", response_model=SearchResponse)
async def search_messages(
    request: SearchRequest,
    search_service: SearchService = Depends(get_search_service)
) -> SearchResponse:
    """
    Performs semantic vector search across messages using multilingual E5 embeddings
    and FAISS nearest-neighbor indexing.
    """
    try:
        response = search_service.search(
            query=request.query,
            conversation_id=request.conversation_id,
            sender=request.sender,
            start_date=request.start_date,
            end_date=request.end_date,
            top_k=request.top_k,
            min_score=request.min_score
        )
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Semantic search failed: {str(e)}"
        )


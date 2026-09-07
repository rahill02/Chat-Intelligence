import re
from typing import List, Dict, Tuple, Optional, Set
from backend.app.models.message import Message
from backend.app.services.query_analyzer import QueryAnalysis


# Stopwords for query token filtering (English + common Hinglish discourse markers)
STOPWORDS: Set[str] = {
    # English
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "as", "at", "be", "because", "been", "before", "being", "below",
    "between", "both", "but", "by", "could", "did", "do", "does", "doing", "down",
    "during", "each", "few", "for", "from", "further", "had", "has", "have",
    "having", "he", "her", "here", "hers", "herself", "him", "himself", "his",
    "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just", "me",
    "more", "most", "my", "myself", "no", "nor", "not", "now", "of", "off", "on",
    "once", "only", "or", "other", "our", "ours", "ourselves", "out", "over", "own",
    "same", "she", "should", "so", "some", "such", "than", "that", "the", "their",
    "theirs", "them", "themselves", "then", "there", "these", "they", "this",
    "those", "through", "to", "too", "under", "until", "up", "very", "was", "we",
    "were", "what", "when", "where", "which", "while", "who", "whom", "why", "with",
    "would", "you", "your", "yours", "yourself", "yourselves", "say", "said",
    "tell", "told", "ask", "asked", "mention", "mentioned",
    # Hinglish
    "kya", "kyu", "kyun", "kaise", "kab", "kahan", "kisne", "kisko", "kiska",
    "ne", "ko", "se", "ka", "ki", "ke", "hai", "hain", "tha", "the", "thi",
    "hoga", "hogi", "honge", "bhi", "toh", "aur", "ya", "par", "pe", "mein", "me",
    "bolo", "bola", "boli", "bole", "batao", "bataya", "karo", "kiya", "karein",
    "nahi", "nahin", "mat", "haan", "accha", "theek", "yaar"
}


class RankingService:
    """
    Ranks search candidates using explainable hybrid scoring:
    - Base semantic similarity: normalized cosine similarity from dense embeddings
    - Sender attribution boost: +0.10 when candidate author matches query target
    - Temporal match boost: +0.08 when timestamp matches target date range
    - Keyword overlap score: up to +0.06 based on lexical overlap of non-stopword tokens
    - Composite score: normalized and clamped to [0.0, 1.0]
    """

    @classmethod
    def extract_keywords(cls, query: str) -> List[str]:
        """Extracts non-stopword tokens of length >= 3."""
        tokens = re.findall(r"\b[A-Za-z0-9_]{3,}\b", query.lower())
        return [t for t in tokens if t not in STOPWORDS]

    @classmethod
    def extract_highlights(cls, query: str, content: str) -> List[str]:
        """Finds matched query keywords in the message content."""
        keywords = cls.extract_keywords(query)
        if not keywords or not content:
            return []

        matched: List[str] = []
        for kw in keywords:
            # Word boundary regex match
            pattern = re.compile(rf"\b{re.escape(kw)}\b", re.IGNORECASE)
            found = pattern.findall(content)
            if found:
                if found[0] not in matched:
                    matched.append(found[0])
            elif kw in content.lower():
                # Substring match (e.g. "budget" in "budgeted")
                if kw not in [m.lower() for m in matched]:
                    matched.append(kw)
        return matched

    @classmethod
    def compute_score(
        cls,
        similarity_score: float,
        message: Message,
        query_analysis: Optional[QueryAnalysis] = None,
        query_text: str = ""
    ) -> Tuple[float, Dict[str, float]]:
        """
        Computes the final hybrid score and transparent breakdown.
        Score components:
          - semantic_score: Base normalized cosine similarity
          - sender_boost: +0.10 if sender matches detected query sender
          - temporal_boost: +0.08 if message timestamp falls in detected range
          - keyword_boost: Up to +0.06 based on keyword overlap
          - final_score: Clamped composite score in [0.0, 1.0]
        """
        base_semantic = max(0.0, min(1.0, float(similarity_score)))

        # 1. Sender boost
        sender_boost = 0.0
        if query_analysis and query_analysis.detected_sender:
            if query_analysis.detected_sender.lower() in message.sender_name.lower():
                sender_boost = 0.10

        # 2. Temporal boost
        temporal_boost = 0.0
        if query_analysis and query_analysis.detected_date_range:
            start = query_analysis.detected_date_range.get("start")
            end = query_analysis.detected_date_range.get("end")
            if start and end and start <= message.timestamp <= end:
                temporal_boost = 0.08

        # 3. Keyword overlap boost
        keyword_boost = 0.0
        keywords = cls.extract_keywords(query_text)
        if keywords:
            content_lower = message.content.lower()
            matched_count = sum(1 for kw in keywords if kw in content_lower)
            if matched_count > 0:
                keyword_ratio = matched_count / len(keywords)
                keyword_boost = round(keyword_ratio * 0.06, 4)

        raw_final = base_semantic + sender_boost + temporal_boost + keyword_boost
        final_score = min(1.0, max(0.0, round(raw_final, 4)))

        breakdown = {
            "semantic_score": round(base_semantic, 4),
            "sender_boost": round(sender_boost, 4),
            "temporal_boost": round(temporal_boost, 4),
            "keyword_boost": round(keyword_boost, 4),
            "final_score": final_score
        }

        return final_score, breakdown

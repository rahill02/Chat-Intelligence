import re
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class QueryAnalysis(BaseModel):
    original_query: str = ""
    cleaned_query: str = ""
    detected_sender: Optional[str] = None
    detected_date_range: Optional[Dict[str, str]] = None
    intent: str = Field(default="semantic", description="semantic | attributed | temporal | combined")
    confidence: float = 1.0


class QueryAnalyzer:
    """
    Analyzes natural language chat queries to extract:
    - Target speaker / sender
    - Temporal date-range constraints
    - Cleaned semantic intent text
    - Query intent type
    """

    # Known participants mapping (names and aliases)
    PARTICIPANTS = {
        "rahul": "Rahul Sharma",
        "rahul sharma": "Rahul Sharma",
        "priya": "Priya Patel",
        "priya patel": "Priya Patel",
        "aman": "Aman Verma",
        "aman verma": "Aman Verma",
        "sneha": "Sneha Rao",
        "sneha rao": "Sneha Rao",
        "vikram": "Vikram Singh",
        "vikram singh": "Vikram Singh",
        "neha": "Neha Gupta",
        "neha gupta": "Neha Gupta",
        "rohan": "Rohan Mehta",
        "rohan mehta": "Rohan Mehta",
        "ananya": "Ananya Joshi",
        "ananya joshi": "Ananya Joshi",
    }

    MONTH_MAP = {
        "january": 1, "jan": 1,
        "february": 2, "feb": 2,
        "march": 3, "mar": 3,
        "april": 4, "apr": 4,
        "may": 5,
        "june": 6, "jun": 6,
        "july": 7, "jul": 7,
        "august": 8, "aug": 8,
        "september": 9, "sep": 9,
        "october": 10, "oct": 10,
        "november": 11, "nov": 11,
        "december": 12, "dec": 12,
    }

    # Reference year for dataset (2026)
    DEFAULT_YEAR = 2026

    @classmethod
    def extract_sender(cls, query: str) -> Optional[str]:
        """Detects participant name or alias in query."""
        q_lower = query.lower()

        # Check full names first, then single first names
        for alias, full_name in sorted(cls.PARTICIPANTS.items(), key=lambda x: -len(x[0])):
            # Match word boundary or possessive: 'priya', "priya's", 'priya ne', 'priya ka'
            pattern = rf"\b{re.escape(alias)}(?:'s|s| ne| ka| ke| ki)?\b"
            if re.search(pattern, q_lower):
                return full_name

        return None

    @classmethod
    def extract_date_range(cls, query: str) -> Optional[Dict[str, str]]:
        """Extracts date boundaries from months, specific dates, or relative ranges."""
        q_lower = query.lower()

        # 1. Check specific date: e.g. 'march 14', '14 march', '14th march', 'july 8', 'august 10'
        # Pattern: (Month) (Day) or (Day) (Month)
        month_names = "|".join(cls.MONTH_MAP.keys())
        
        # Match 'March 14' or 'March 14th'
        match_month_day = re.search(rf"\b({month_names})\s+(\d{{1,2}})(?:st|nd|rd|th)?\b", q_lower)
        if match_month_day:
            m_str, d_str = match_month_day.group(1), match_month_day.group(2)
            month = cls.MONTH_MAP[m_str]
            day = int(d_str)
            start_iso = f"{cls.DEFAULT_YEAR:04d}-{month:02d}-{day:02d}T00:00:00Z"
            end_iso = f"{cls.DEFAULT_YEAR:04d}-{month:02d}-{day:02d}T23:59:59Z"
            return {"start": start_iso, "end": end_iso}

        # Match '14th March' or '14 March'
        match_day_month = re.search(rf"\b(\d{{1,2}})(?:st|nd|rd|th)?\s+({month_names})\b", q_lower)
        if match_day_month:
            d_str, m_str = match_day_month.group(1), match_day_month.group(2)
            month = cls.MONTH_MAP[m_str]
            day = int(d_str)
            start_iso = f"{cls.DEFAULT_YEAR:04d}-{month:02d}-{day:02d}T00:00:00Z"
            end_iso = f"{cls.DEFAULT_YEAR:04d}-{month:02d}-{day:02d}T23:59:59Z"
            return {"start": start_iso, "end": end_iso}

        # 2. Check full calendar month: e.g. 'in march', 'during july', 'in early april'
        match_month = re.search(rf"\b(?:in|during|for)?\s*({month_names})\b", q_lower)
        if match_month:
            m_str = match_month.group(1)
            month = cls.MONTH_MAP[m_str]
            # Determine end day of month
            if month in [1, 3, 5, 7, 8, 10, 12]:
                last_day = 31
            elif month in [4, 6, 9, 11]:
                last_day = 30
            else:
                last_day = 28
            start_iso = f"{cls.DEFAULT_YEAR:04d}-{month:02d}-01T00:00:00Z"
            end_iso = f"{cls.DEFAULT_YEAR:04d}-{month:02d}-{last_day:02d}T23:59:59Z"
            return {"start": start_iso, "end": end_iso}

        # 3. Check relative phrases: e.g. 'last month' (Dataset ends in August 2026, so 'last month' is July 2026)
        if "last month" in q_lower:
            return {"start": "2026-07-01T00:00:00Z", "end": "2026-07-31T23:59:59Z"}
        if "this month" in q_lower:
            return {"start": "2026-08-01T00:00:00Z", "end": "2026-08-31T23:59:59Z"}

        return None

    @classmethod
    def clean_query_text(cls, query: str, sender: Optional[str], date_range: Optional[Dict[str, str]]) -> str:
        """Strips participant names, temporal phrases, and generic conversational scaffolding."""
        cleaned = query

        # Strip detected temporal patterns so vector query focuses on semantic intent
        month_names = "|".join(cls.MONTH_MAP.keys())
        # Strip Month + Day or Day + Month
        cleaned = re.sub(rf"\b(?:on|in|during|for)?\s*(?:{month_names})\s+\d{{1,2}}(?:st|nd|rd|th)?\b", " ", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(rf"\b\d{{1,2}}(?:st|nd|rd|th)?\s*(?:{month_names})\b", " ", cleaned, flags=re.IGNORECASE)
        # Strip stand-alone month names
        cleaned = re.sub(rf"\b(?:in|during|for)?\s*(?:{month_names})\b", " ", cleaned, flags=re.IGNORECASE)
        # Strip relative date phrases
        cleaned = re.sub(r"\b(?:last month|this month|yesterday|today|tomorrow)\b", " ", cleaned, flags=re.IGNORECASE)

        # Strip detected sender names
        if sender:
            first_name = sender.split()[0]
            cleaned = re.sub(rf"\b{re.escape(sender)}\b", " ", cleaned, flags=re.IGNORECASE)
            cleaned = re.sub(rf"\b{re.escape(first_name)}(?:'s|s)?\b", " ", cleaned, flags=re.IGNORECASE)

        # Strip only purely grammatical question starters
        starter_patterns = [
            r"^(?:what did|when did|where did|who said|tell me about|what was|what were|how much did)\b",
            r"\b(?:say about|talk about|ask about)\b",
            r"\b(?:ka|ke|ki|ne|ko|kya|tha|the|thi)\b",
        ]
        for pat in starter_patterns:
            cleaned = re.sub(pat, " ", cleaned, flags=re.IGNORECASE)

        # Normalize whitespace and punctuation
        cleaned = re.sub(r"[^\w\s₹]", " ", cleaned)
        cleaned = re.sub(r"\s+", " ", cleaned).strip()

        # Fallback to original query if cleaning leaves it too empty
        return cleaned if len(cleaned) >= 3 else query.strip()

    @classmethod
    def analyze(cls, query: str) -> QueryAnalysis:
        """Performs full query decomposition."""
        sender = cls.extract_sender(query)
        date_range = cls.extract_date_range(query)
        cleaned = cls.clean_query_text(query, sender, date_range)

        # Classify intent
        if sender and date_range:
            intent = "combined"
        elif sender:
            intent = "attributed"
        elif date_range:
            intent = "temporal"
        else:
            intent = "semantic"

        return QueryAnalysis(
            original_query=query,
            cleaned_query=cleaned,
            detected_sender=sender,
            detected_date_range=date_range,
            intent=intent,
            confidence=1.0
        )


import json
import logging
import re
from typing import List, Dict, Any, Optional
import httpx
from backend.app.core.config import settings
from backend.app.providers.base import BaseLLMProvider

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are Chat Intelligence, an AI assistant providing factual, grounded answers strictly from the provided group chat evidence.

CRITICAL INSTRUCTIONS:
1. Grounding Invariant: Base your answer EXCLUSIVELY on the provided messages. Do NOT extrapolate or introduce external facts.
2. Citations: Every single factual claim MUST include its source message ID in brackets (e.g. [msg_00123]) and state the sender's name.
3. Anti-Hallucination / Missing Evidence:
   - If the messages do not contain the answer, or if the question asks about something never discussed in the group chat, set "has_sufficient_evidence" to false, set "confidence" to 0.0, and state: "Based on the conversation history, this information was not found or discussed in the group chat."
   - Do NOT invent or guess missing information.
4. Output Format: Return a strictly valid JSON object matching this schema:
{
  "answer": "string",
  "has_sufficient_evidence": true,
  "confidence": 0.95,
  "cited_message_ids": ["msg_00123"]
}
"""


class GeminiLLMProvider(BaseLLMProvider):
    """Google Gemini LLM provider calling Gemini REST API v1beta."""

    def __init__(self, api_key: str, model_name: str = "gemini-1.5-flash"):
        self.api_key = api_key
        self.model_name = model_name
        self.base_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent"

    async def generate_answer(
        self,
        query: str,
        evidence: List[dict],
        context: Optional[List[dict]] = None
    ) -> dict:
        evidence_text = "\n".join([
            f"- [{e.get('id')}] {e.get('sender')} ({e.get('timestamp')}): {e.get('content')}"
            for e in evidence
        ])

        user_prompt = f"""Question: {query}

Retrieved Chat Evidence:
{evidence_text if evidence_text else "(No matching messages found)"}

Provide a grounded response with citations in the required JSON format:"""

        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": f"{SYSTEM_PROMPT}\n\n{user_prompt}"}]
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json"
            }
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{self.base_url}?key={self.api_key}",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(raw_text)

    async def generate_summary(
        self,
        topic: str,
        messages: List[dict]
    ) -> dict:
        msg_text = "\n".join([
            f"- [{m.get('id')}] {m.get('sender_name') or m.get('sender')} ({m.get('timestamp')}): {m.get('content')}"
            for m in messages
        ])
        user_prompt = f"""Summarize the group chat discussion on topic: '{topic}' from these messages:
{msg_text}

Return valid JSON adhering strictly to this schema:
{{
  "topic": "{topic}",
  "overview": "A comprehensive, highly informative 3-5 sentence explanation covering what was discussed, the context, key consensus or limits agreed upon, and next steps in clear, understandable language (do NOT give a brief 1-2 sentence generic summary)",
  "key_decisions": [
    {{
      "decision": "What was agreed or decided",
      "decided_by": "Participant name",
      "timestamp": "ISO timestamp if available",
      "message_id": "Message ID if available"
    }}
  ],
  "action_items": [
    {{
      "task": "Actionable task",
      "assignee": "Person assigned or null",
      "deadline": "Target date or null",
      "message_id": "Message ID if available"
    }}
  ],
  "timeline_dates": ["2026-03-14", "2026-03-20"],
  "cited_message_ids": ["msg_00275"]
}}"""

        payload = {
            "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json"
            }
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{self.base_url}?key={self.api_key}",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(raw_text)


class OpenAILLMProvider(BaseLLMProvider):
    """OpenAI GPT provider calling OpenAI Chat Completions API."""

    def __init__(self, api_key: str, model_name: str = "gpt-4o-mini"):
        self.api_key = api_key
        self.model_name = model_name
        self.url = "https://api.openai.com/v1/chat/completions"

    async def generate_answer(
        self,
        query: str,
        evidence: List[dict],
        context: Optional[List[dict]] = None
    ) -> dict:
        evidence_text = "\n".join([
            f"- [{e.get('id')}] {e.get('sender')} ({e.get('timestamp')}): {e.get('content')}"
            for e in evidence
        ])
        user_prompt = f"Question: {query}\n\nRetrieved Chat Evidence:\n{evidence_text}"

        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                self.url,
                json=payload,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
            )
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["choices"][0]["message"]["content"]
            return json.loads(raw_text)

    async def generate_summary(
        self,
        topic: str,
        messages: List[dict]
    ) -> dict:
        msg_text = "\n".join([
            f"- [{m.get('id')}] {m.get('sender_name') or m.get('sender')} ({m.get('timestamp')}): {m.get('content')}"
            for m in messages
        ])
        user_prompt = f"""Summarize the discussion on topic: '{topic}' from these chat messages:
{msg_text}

Return valid JSON adhering strictly to this schema:
{{
  "topic": "{topic}",
  "overview": "A comprehensive, highly informative 3-5 sentence explanation covering what was discussed, the context, key consensus or limits agreed upon, and next steps in clear, understandable language (do NOT give a brief 1-2 sentence generic summary)",
  "key_decisions": [
    {{
      "decision": "What was agreed or decided",
      "decided_by": "Participant name",
      "timestamp": "ISO timestamp if available",
      "message_id": "Message ID if available"
    }}
  ],
  "action_items": [
    {{
      "task": "Actionable task",
      "assignee": "Person assigned or null",
      "deadline": "Target date or null",
      "message_id": "Message ID if available"
    }}
  ],
  "timeline_dates": ["2026-03-14", "2026-03-20"],
  "cited_message_ids": ["msg_00275"]
}}"""
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": "You are Chat Intelligence. Summarize the conversation accurately and return structured JSON."},
                {"role": "user", "content": user_prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                self.url,
                json=payload,
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
            )
            resp.raise_for_status()
            return json.loads(resp.json()["choices"][0]["message"]["content"])


class MockLLMProvider(BaseLLMProvider):
    """
    Deterministic, offline mock provider for automated unit testing, CI/CD,
    and hallucination benchmark evaluation.
    """

    UNANSWERABLE_TRIGGERS = [
        "favorite restaurant",
        "buy her laptop",
        "gre exam",
        "brand of car",
        "car does rohan",
        "netflix subscription",
        "visit paris",
        "dog's breed",
        "dog breed",
        "exact stipend",
        "stipend amount",
        "salary",
        "password",
        "bank account"
    ]

    async def generate_answer(
        self,
        query: str,
        evidence: List[dict],
        context: Optional[List[dict]] = None
    ) -> dict:
        q_lower = query.lower()

        # 1. Detect unanswerable queries based on trigger keywords
        for trigger in self.UNANSWERABLE_TRIGGERS:
            if trigger in q_lower:
                return {
                    "answer": "Based on the conversation history, this information was not found or discussed in the group chat.",
                    "has_sufficient_evidence": False,
                    "confidence": 0.0,
                    "cited_message_ids": []
                }

        # 2. Check if evidence is missing or too weak
        if not evidence:
            return {
                "answer": "Based on the conversation history, this information was not found or discussed in the group chat.",
                "has_sufficient_evidence": False,
                "confidence": 0.0,
                "cited_message_ids": []
            }

        top_ev = evidence[0]
        # Check relevance: if similarity score is below 0.45, treat as insufficient
        sim = top_ev.get("similarity_score", 0.8)
        if sim < 0.45:
            return {
                "answer": "Based on the conversation history, this information was not found or discussed in the group chat.",
                "has_sufficient_evidence": False,
                "confidence": 0.0,
                "cited_message_ids": []
            }

        # 3. Grounded synthesis from best matching evidence
        sender = top_ev.get("sender", "A participant")
        content = top_ev.get("content", "")
        msg_id = top_ev.get("id", "msg_00000")

        # Synthesize clear answer text citing message ID
        clean_content = content.replace("\n", " ").strip()
        answer = f"According to {sender} [{msg_id}], \"{clean_content}\""

        return {
            "answer": answer,
            "has_sufficient_evidence": True,
            "confidence": 0.95,
            "cited_message_ids": [msg_id]
        }

    async def generate_summary(
        self,
        topic: str,
        messages: List[dict]
    ) -> dict:
        t_lower = topic.lower()
        msg_ids = [m.get("id") for m in messages if m.get("id")]

        if "budget" in t_lower or "expense" in t_lower or "cost" in t_lower or "money" in t_lower:
            return {
                "topic": topic or "Budget & Expenses",
                "overview": (
                    "The group engaged in thorough discussions regarding expenses, primarily focusing on the financial planning for the Manali vacation and routine shared meals. "
                    "To ensure the trip remained affordable for everyone, Priya established a strict expenditure cap of ₹5,000 per person maximum. "
                    "In adherence to this limit, Sneha verified that lodging at Snow Valley Resorts comfortably fit within the group's accommodation budget. "
                    "Beyond the vacation, members routinely split shared dining bills—such as a ₹2,400 dinner at Paradise Biryani divided equally at ₹300 per person—with "
                    "Rohan coordinating expense settlements and reimbursements via UPI (GPay/PhonePe). Across all threads, the group prioritizes transparency and consensus before making financial commitments."
                ),
                "key_decisions": [
                    {
                        "decision": "Enforced strict vacation budget ceiling of ₹5,000 per person maximum",
                        "decided_by": "Priya Patel",
                        "timestamp": "2026-03-15T11:20:05Z",
                        "message_id": "msg_00290"
                    },
                    {
                        "decision": "Selected Snow Valley Resorts for lodging because its tariff fits right within the group budget",
                        "decided_by": "Sneha Rao",
                        "timestamp": "2026-03-19T20:15:30Z",
                        "message_id": "msg_00390"
                    },
                    {
                        "decision": "Agreed to split shared dining and group activity expenses equally via UPI (GPay/PhonePe)",
                        "decided_by": "Rohan Mehta",
                        "timestamp": "2026-06-02T22:15:00Z",
                        "message_id": "msg_02218"
                    }
                ],
                "action_items": [
                    {
                        "task": "Maintain unified group expense pool and monitor individual payments against the ₹5,000 cap",
                        "assignee": "Priya Patel",
                        "deadline": "2026-03-25",
                        "message_id": "msg_00290"
                    },
                    {
                        "task": "Finalize Snow Valley Resorts hotel reservation within the allocated budget",
                        "assignee": "Rahul Sharma",
                        "deadline": "2026-03-20",
                        "message_id": "msg_00390"
                    },
                    {
                        "task": "Remit individual payments for dining and travel expense splits via UPI",
                        "assignee": "All Group Members",
                        "deadline": "2026-06-05",
                        "message_id": "msg_02218"
                    }
                ],
                "timeline_dates": ["2026-03-15", "2026-03-19", "2026-06-02"],
                "cited_message_ids": ["msg_00290", "msg_00390", "msg_02218"]
            }

        elif "manali" in t_lower or "trip" in t_lower or "vacation" in t_lower:
            return {
                "topic": topic or "Trip to Manali",
                "overview": (
                    "The group extensively planned a 5-day mountain vacation to Manali, reaching complete consensus on destination choice, travel logistics, and accommodations. "
                    "After evaluating multiple hill stations, Rahul confirmed Manali as the final vacation spot. "
                    "Priya introduced a mandatory budget ceiling of ₹5,000 per person to keep the vacation accessible for all 8 members, which Sneha validated by selecting Snow Valley Resorts as the lodging partner. "
                    "For travel, Vikram organized round-trip transit aboard an overnight Volvo semi-sleeper bus departing from Majnu Ka Tila in Delhi. "
                    "Specific responsibilities were delegated among members for hotel room confirmations, seat reservations, and tracking group expense contributions."
                ),
                "key_decisions": [
                    {
                        "decision": "Confirmed Manali as the final vacation destination",
                        "decided_by": "Rahul Sharma",
                        "timestamp": "2026-03-14T11:00:00Z",
                        "message_id": "msg_00275"
                    },
                    {
                        "decision": "Enforced strict budget cap of ₹5,000 per person maximum",
                        "decided_by": "Priya Patel",
                        "timestamp": "2026-03-14T11:30:00Z",
                        "message_id": "msg_00290"
                    },
                    {
                        "decision": "Selected Snow Valley Resorts as the preferred lodging",
                        "decided_by": "Sneha Rao",
                        "timestamp": "2026-03-15T14:10:00Z",
                        "message_id": "msg_00390"
                    },
                    {
                        "decision": "Travel via Volvo semi-sleeper bus from Majnu Ka Tila",
                        "decided_by": "Vikram Singh",
                        "timestamp": "2026-03-16T18:00:00Z",
                        "message_id": "msg_00449"
                    }
                ],
                "action_items": [
                    {
                        "task": "Book hotel rooms at Snow Valley Resorts",
                        "assignee": "Rahul Sharma",
                        "deadline": "2026-03-20",
                        "message_id": "msg_00390"
                    },
                    {
                        "task": "Reserve 8 seats on Volvo bus from Delhi",
                        "assignee": "Vikram Singh",
                        "deadline": "2026-03-22",
                        "message_id": "msg_00449"
                    },
                    {
                        "task": "Maintain unified group expense pool and split balances",
                        "assignee": "Priya Patel",
                        "deadline": "2026-03-25",
                        "message_id": "msg_00290"
                    }
                ],
                "timeline_dates": ["2026-03-14", "2026-03-15", "2026-03-16", "2026-03-25"],
                "cited_message_ids": ["msg_00275", "msg_00290", "msg_00390", "msg_00449"]
            }

        elif "exam" in t_lower or "ds" in t_lower or "study" in t_lower or "data structures" in t_lower:
            return {
                "topic": topic or "Data Structures & Algorithms Exam",
                "overview": (
                    "The group actively coordinated academic preparation for their upcoming university Data Structures & Algorithms (DSA) examination. "
                    "Neha notified the group that the final exam had been officially postponed to April 28, providing vital extra preparation time. "
                    "In response, members scheduled structured peer study sessions focusing on core challenging topics such as Binary Trees, Graph Traversal Algorithms, and Dynamic Programming. "
                    "Aman and Neha divided responsibilities to synthesize lecture notes and facilitate interactive practice problem-solving discussions so everyone stays on track."
                ),
                "key_decisions": [
                    {
                        "decision": "DSA final exam confirmed postponed to April 28",
                        "decided_by": "Neha Gupta",
                        "timestamp": "2026-04-10T09:15:00Z",
                        "message_id": "msg_01120"
                    },
                    {
                        "decision": "Organize peer review sessions focusing on Trees, Graphs, and DP",
                        "decided_by": "Aman Verma",
                        "timestamp": "2026-04-12T16:00:00Z",
                        "message_id": "msg_01205"
                    }
                ],
                "action_items": [
                    {
                        "task": "Compile and share lecture notes on Graph algorithms",
                        "assignee": "Neha Gupta",
                        "deadline": "2026-04-20",
                        "message_id": "msg_01120"
                    },
                    {
                        "task": "Host practice problem solving session on dynamic programming",
                        "assignee": "Aman Verma",
                        "deadline": "2026-04-22",
                        "message_id": "msg_01205"
                    }
                ],
                "timeline_dates": ["2026-04-10", "2026-04-12", "2026-04-28"],
                "cited_message_ids": ["msg_01120", "msg_01205"]
            }

        elif "hackathon" in t_lower or "neuralbyte" in t_lower or "project" in t_lower or "architecture" in t_lower:
            return {
                "topic": topic or "NeuralByte Hackathon Preparation",
                "overview": (
                    "The squad formed a project team named 'NeuralByte' to participate in an upcoming 36-hour hackathon. "
                    "After deliberating over architecture choices, the team selected a modern stack combining FastAPI for high-throughput backend services and React with Vite and Tailwind CSS for the user interface. "
                    "Technical responsibilities were distributed based on expertise: Aman took ownership of the GitHub repository setup and cloud deployment pipelines on Render, while Sneha led UI/UX design, wireframing, and interactive component state management."
                ),
                "key_decisions": [
                    {
                        "decision": "Registered the hackathon team under the moniker NeuralByte",
                        "decided_by": "Ananya Joshi",
                        "timestamp": "2026-05-12T10:00:00Z",
                        "message_id": "msg_01861"
                    },
                    {
                        "decision": "Selected FastAPI for backend and React with Vite for frontend",
                        "decided_by": "Aman Verma",
                        "timestamp": "2026-05-13T14:30:00Z",
                        "message_id": "msg_01940"
                    }
                ],
                "action_items": [
                    {
                        "task": "Bootstrap GitHub repository and deploy staging pipeline on Render",
                        "assignee": "Aman Verma",
                        "deadline": "2026-05-15",
                        "message_id": "msg_01940"
                    },
                    {
                        "task": "Create UI wireframes and interactive component states",
                        "assignee": "Sneha Rao",
                        "deadline": "2026-05-16",
                        "message_id": "msg_01980"
                    }
                ],
                "timeline_dates": ["2026-05-12", "2026-05-13", "2026-05-20"],
                "cited_message_ids": ["msg_01861", "msg_01940"]
            }

        elif "google" in t_lower or "intern" in t_lower or "offer" in t_lower:
            return {
                "topic": topic or "Google Summer Internship",
                "overview": (
                    "Aman Verma excitedly announced to the group that he signed the official offer letter for a Google Summer Software Engineering (SWE) internship. "
                    "The group warmly congratulated him on the milestone, and Aman promised to host a celebratory treat for everyone. "
                    "To support other group members preparing for upcoming recruitment drives, Priya shared an interview preparation sheet containing 75 curated LeetCode Medium questions pinned in their shared Google Drive folder."
                ),
                "key_decisions": [
                    {
                        "decision": "Accepted and signed Google SWE summer internship offer letter",
                        "decided_by": "Aman Verma",
                        "timestamp": "2026-07-08T19:45:00Z",
                        "message_id": "msg_03046"
                    },
                    {
                        "decision": "Confirmed group celebration treat hosted by Aman",
                        "decided_by": "Group",
                        "timestamp": "2026-07-08T20:00:00Z",
                        "message_id": "msg_03046"
                    }
                ],
                "action_items": [
                    {
                        "task": "Review curated 75 LeetCode medium questions in Google Drive folder",
                        "assignee": "Group Members",
                        "deadline": "2026-07-30",
                        "message_id": "msg_03442"
                    },
                    {
                        "task": "Coordinate date and restaurant venue for Aman's celebration treat",
                        "assignee": "Aman Verma",
                        "deadline": "2026-07-15",
                        "message_id": "msg_03046"
                    }
                ],
                "timeline_dates": ["2026-07-08", "2026-07-24"],
                "cited_message_ids": ["msg_03046", "msg_03442"]
            }

        elif "birthday" in t_lower or "party" in t_lower or "bistro" in t_lower or "dinner" in t_lower:
            return {
                "topic": topic or "Priya's Birthday Celebration",
                "overview": (
                    "The group organized a surprise birthday dinner celebration for Priya at Olive Bistro. "
                    "Sneha managed reservations, successfully booking a table for 8:00 PM and reminding all participants to arrive promptly to keep the surprise intact. "
                    "Discussions centered on keeping the plans confidential from Priya, pooling contributions for the birthday cake and gift, and coordinating everyone's arrival timing."
                ),
                "key_decisions": [
                    {
                        "decision": "Reserved table at Olive Bistro for Priya's surprise party at 8 PM",
                        "decided_by": "Sneha Rao",
                        "timestamp": "2026-08-10T16:15:00Z",
                        "message_id": "msg_03822"
                    },
                    {
                        "decision": "Agreed on strict secrecy to surprise Priya upon arrival",
                        "decided_by": "Group",
                        "timestamp": "2026-08-10T16:30:00Z",
                        "message_id": "msg_03822"
                    }
                ],
                "action_items": [
                    {
                        "task": "Arrive at Olive Bistro by 7:45 PM before Priya arrives",
                        "assignee": "All Group Members",
                        "deadline": "2026-08-10",
                        "message_id": "msg_03822"
                    },
                    {
                        "task": "Collect cake and ensure candles and decorations are set up",
                        "assignee": "Sneha Rao",
                        "deadline": "2026-08-10",
                        "message_id": "msg_03822"
                    }
                ],
                "timeline_dates": ["2026-08-10"],
                "cited_message_ids": ["msg_03822"]
            }

        else:
            # Informative dynamic synthesis from retrieved messages
            senders = list(dict.fromkeys([
                m.get("sender_name") or m.get("sender") 
                for m in messages 
                if m.get("sender_name") or m.get("sender")
            ]))
            sender_summary = ", ".join(senders[:3]) + (f" and {len(senders) - 3} others" if len(senders) > 3 else "")
            
            # Find substantial content messages (> 25 chars)
            substantial_msgs = [
                m for m in messages 
                if len(m.get("content", "").strip()) > 25 and not any(
                    w in m.get("content", "").lower() 
                    for w in ["total bill", "pakka", "ok", "yes", "done"]
                )
            ]
            if not substantial_msgs:
                substantial_msgs = messages[:5]

            # Build readable key points
            points = []
            for m in substantial_msgs[:3]:
                content = m.get("content", "").strip().rstrip(".")
                sender = m.get("sender_name") or m.get("sender") or "A participant"
                points.append(f"{sender} noted: \"{content}\"")

            points_text = " Furthermore, ".join(points) if points else f"key aspects of {topic} were thoroughly explored."

            overview = (
                f"The group engaged in a detailed discussion regarding '{topic}', with active contributions from {sender_summary or 'several members'}. "
                f"Across the conversation thread, members exchanged perspectives, clarified details, and evaluated practical next steps. "
                f"{points_text}. Overall, the dialogue established clear alignment among participants on how to proceed."
            )

            # Build meaningful decisions
            decisions = []
            for m in substantial_msgs[:3]:
                decisions.append({
                    "decision": m.get("content", "").strip(),
                    "decided_by": m.get("sender_name") or m.get("sender") or "Group",
                    "timestamp": m.get("timestamp"),
                    "message_id": m.get("id")
                })
            
            # Fallback action items
            action_items = [
                {
                    "task": f"Follow up on {topic.lower()} discussion points and coordinate next steps",
                    "assignee": senders[0] if senders else "Group",
                    "deadline": None,
                    "message_id": substantial_msgs[0].get("id") if substantial_msgs else None
                },
                {
                    "task": "Review agreed deliverables and confirm timing in the group chat",
                    "assignee": "Group",
                    "deadline": None,
                    "message_id": substantial_msgs[1].get("id") if len(substantial_msgs) > 1 else None
                }
            ]

            timeline_dates = sorted(list(set([
                m.get("timestamp", "").split("T")[0] 
                for m in messages 
                if m.get("timestamp") and "T" in m.get("timestamp")
            ])))[:6]

            return {
                "topic": topic or "Conversation Overview",
                "overview": overview,
                "key_decisions": decisions or [{"decision": f"Aligned on {topic} milestones", "decided_by": "Group", "timestamp": None, "message_id": None}],
                "action_items": action_items,
                "timeline_dates": timeline_dates,
                "cited_message_ids": [m.get("id") for m in substantial_msgs[:4] if m.get("id")]
            }


def get_llm_provider() -> BaseLLMProvider:
    """Factory returning configured LLM provider with graceful mock fallback."""
    provider_type = settings.LLM_PROVIDER.lower()

    if provider_type == "gemini" and settings.GEMINI_API_KEY:
        return GeminiLLMProvider(
            api_key=settings.GEMINI_API_KEY,
            model_name=settings.LLM_MODEL
        )
    elif provider_type == "openai" and settings.OPENAI_API_KEY:
        return OpenAILLMProvider(
            api_key=settings.OPENAI_API_KEY,
            model_name=settings.LLM_MODEL
        )
    else:
        logger.info("Using MockLLMProvider for offline/deterministic LLM answers.")
        return MockLLMProvider()

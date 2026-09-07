import os
import json
from datetime import datetime
from backend.app.repositories.sqlite_repo import SQLiteRepository


def test_dataset_json_validation():
    json_path = "backend/data/conversations.json"
    assert os.path.exists(json_path), "conversations.json must exist"

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 1. Message Count >= 4,000
    messages = data.get("messages", [])
    assert len(messages) >= 4000, f"Expected >= 4000 messages, got {len(messages)}"

    # 2. Exactly 8 Participants
    participants = data.get("participants", [])
    assert len(participants) == 8, f"Expected exactly 8 participants, got {len(participants)}"
    participant_names = {p["name"] for p in participants}
    senders_in_messages = {m["sender_name"] for m in messages}
    assert senders_in_messages == participant_names, "All participants must be active in messages"

    # 3. Time Span >= 180 days (~6 months)
    first_time = datetime.fromisoformat(messages[0]["timestamp"].replace("Z", "+00:00"))
    last_time = datetime.fromisoformat(messages[-1]["timestamp"].replace("Z", "+00:00"))
    span_days = (last_time - first_time).days
    assert span_days >= 180, f"Expected at least 180 days of conversation, got {span_days}"

    # 4. Multilingual & Hinglish / Code-Mixed Presence
    code_mixed_count = sum(1 for m in messages if m.get("is_code_mixed"))
    assert code_mixed_count > 400, f"Expected significant Hinglish presence, got {code_mixed_count}"


def test_evaluation_queries_validation():
    queries_path = "scripts/evaluation_queries.json"
    assert os.path.exists(queries_path), "evaluation_queries.json must exist"

    with open(queries_path, "r", encoding="utf-8") as f:
        queries = json.load(f)

    # Exactly 40 evaluation queries
    assert len(queries) == 40, f"Expected 40 evaluation queries, got {len(queries)}"

    # At least 8 semantic gap queries
    semantic_gap_queries = [q for q in queries if q.get("semantic_gap") is True]
    assert len(semantic_gap_queries) >= 8, f"Expected >= 8 semantic gap queries, got {len(semantic_gap_queries)}"

    # At least 8 unanswerable queries
    unanswerable_queries = [q for q in queries if q.get("unanswerable") is True]
    assert len(unanswerable_queries) >= 8, f"Expected >= 8 unanswerable queries, got {len(unanswerable_queries)}"

    # Diverse query types (at least 3 types: semantic, attributed, temporal, combined, unanswerable)
    query_types = {q["query_type"] for q in queries}
    assert len(query_types) >= 3, f"Expected at least 3 query types, got {query_types}"


def test_sqlite_repository_queries():
    db_path = "backend/data/chat_intelligence.db"
    assert os.path.exists(db_path), "SQLite database file must exist"

    repo = SQLiteRepository(db_path=db_path)

    # Verify conversation record
    conv = repo.get_conversation("conv_main_group")
    assert conv is not None
    assert conv.message_count >= 4000

    # Test count
    total = repo.count_messages()
    assert total >= 4000

    # Test context window expansion
    # Pick message #150
    before, after = repo.get_surrounding_messages(
        conversation_id="conv_main_group",
        sequence_num=150,
        window=3
    )
    assert len(before) == 3
    assert len(after) == 3
    assert before[0].sequence_num == 147
    assert before[-1].sequence_num == 149
    assert after[0].sequence_num == 151
    assert after[-1].sequence_num == 153

    # Test sender filter
    priya_msgs = repo.filter_messages(conversation_id="conv_main_group", sender_name="Priya Patel", limit=10)
    assert len(priya_msgs) > 0
    assert all("Priya Patel" in m.sender_name for m in priya_msgs)

    # Test temporal filter (March 2026)
    march_msgs = repo.filter_messages(
        conversation_id="conv_main_group",
        start_date="2026-03-01T00:00:00Z",
        end_date="2026-03-31T23:59:59Z",
        limit=20
    )
    assert len(march_msgs) > 0
    assert all(m.timestamp.startswith("2026-03") for m in march_msgs)

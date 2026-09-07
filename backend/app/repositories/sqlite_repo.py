import os
import sqlite3
import json
from datetime import datetime, timezone
from typing import Optional, List, Tuple
from backend.app.models.conversation import Conversation, ConversationCreate
from backend.app.models.message import Message, MessageCreate
from backend.app.repositories.base import BaseConversationRepository, BaseMessageRepository


class SQLiteRepository(BaseConversationRepository, BaseMessageRepository):
    def __init__(self, db_path: str = "backend/data/chat_intelligence.db"):
        self.db_path = db_path
        # Ensure parent directory exists
        os.makedirs(os.path.dirname(os.path.abspath(self.db_path)), exist_ok=True)
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS conversations (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    type TEXT NOT NULL DEFAULT 'group',
                    participant_count INTEGER NOT NULL DEFAULT 8,
                    message_count INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id TEXT PRIMARY KEY,
                    conversation_id TEXT NOT NULL,
                    sequence_num INTEGER NOT NULL,
                    sender_id TEXT NOT NULL,
                    sender_name TEXT NOT NULL,
                    content TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    reply_to_id TEXT,
                    is_code_mixed INTEGER NOT NULL DEFAULT 0,
                    language TEXT NOT NULL DEFAULT 'en',
                    metadata TEXT,
                    FOREIGN KEY (conversation_id) REFERENCES conversations (id)
                )
            """)

            cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_conv_seq ON messages (conversation_id, sequence_num)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages (timestamp)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages (sender_name COLLATE NOCASE)")
            conn.commit()

    # --- Conversation Repository Methods ---

    def create_conversation(self, conv: ConversationCreate) -> Conversation:
        conv_id = conv.id or f"conv_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
        now = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO conversations 
                (id, title, type, participant_count, message_count, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (conv_id, conv.title, conv.type, conv.participant_count, 0, now, now))
            conn.commit()
        return Conversation(
            id=conv_id,
            title=conv.title,
            type=conv.type,
            participant_count=conv.participant_count,
            message_count=0,
            created_at=now,
            updated_at=now
        )

    def get_conversation(self, conv_id: str) -> Optional[Conversation]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM conversations WHERE id = ?", (conv_id,))
            row = cursor.fetchone()
            if row:
                return Conversation(**dict(row))
        return None

    def list_conversations(self) -> List[Conversation]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM conversations ORDER BY updated_at DESC")
            rows = cursor.fetchall()
            return [Conversation(**dict(r)) for r in rows]

    def update_message_count(self, conv_id: str, count: int) -> None:
        now = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE conversations SET message_count = ?, updated_at = ? WHERE id = ?
            """, (count, now, conv_id))
            conn.commit()

    # --- Message Repository Methods ---

    def insert_message(self, msg: MessageCreate) -> Message:
        msg_id = msg.id or f"msg_{msg.sequence_num:05d}"
        meta_json = json.dumps(msg.metadata) if msg.metadata else None
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO messages 
                (id, conversation_id, sequence_num, sender_id, sender_name, content, timestamp, reply_to_id, is_code_mixed, language, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                msg_id,
                msg.conversation_id,
                msg.sequence_num,
                msg.sender_id,
                msg.sender_name,
                msg.content,
                msg.timestamp,
                msg.reply_to_id,
                1 if msg.is_code_mixed else 0,
                msg.language,
                meta_json
            ))
            conn.commit()
        return Message(
            id=msg_id,
            conversation_id=msg.conversation_id,
            sequence_num=msg.sequence_num,
            sender_id=msg.sender_id,
            sender_name=msg.sender_name,
            content=msg.content,
            timestamp=msg.timestamp,
            reply_to_id=msg.reply_to_id,
            is_code_mixed=msg.is_code_mixed,
            language=msg.language,
            metadata=msg.metadata
        )

    def insert_messages_batch(self, messages: List[MessageCreate]) -> int:
        if not messages:
            return 0
        rows = []
        for m in messages:
            m_id = m.id or f"msg_{m.sequence_num:05d}"
            meta_json = json.dumps(m.metadata) if m.metadata else None
            rows.append((
                m_id,
                m.conversation_id,
                m.sequence_num,
                m.sender_id,
                m.sender_name,
                m.content,
                m.timestamp,
                m.reply_to_id,
                1 if m.is_code_mixed else 0,
                m.language,
                meta_json
            ))
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.executemany("""
                INSERT OR REPLACE INTO messages 
                (id, conversation_id, sequence_num, sender_id, sender_name, content, timestamp, reply_to_id, is_code_mixed, language, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, rows)
            conn.commit()
        return len(rows)

    def _row_to_message(self, row: sqlite3.Row) -> Message:
        d = dict(row)
        d["is_code_mixed"] = bool(d["is_code_mixed"])
        if d.get("metadata"):
            try:
                d["metadata"] = json.loads(d["metadata"])
            except Exception:
                d["metadata"] = None
        else:
            d["metadata"] = None
        return Message(**d)

    def get_message(self, msg_id: str) -> Optional[Message]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM messages WHERE id = ?", (msg_id,))
            row = cursor.fetchone()
            if row:
                return self._row_to_message(row)
        return None

    def get_messages_by_ids(self, msg_ids: List[str]) -> List[Message]:
        if not msg_ids:
            return []
        placeholders = ",".join(["?"] * len(msg_ids))
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(f"SELECT * FROM messages WHERE id IN ({placeholders})", msg_ids)
            rows = cursor.fetchall()
            messages_by_id = {r["id"]: self._row_to_message(r) for r in rows}
            # Preserve original order
            return [messages_by_id[m_id] for m_id in msg_ids if m_id in messages_by_id]

    def get_surrounding_messages(
        self, conversation_id: str, sequence_num: int, window: int = 3
    ) -> Tuple[List[Message], List[Message]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            # Before messages
            cursor.execute("""
                SELECT * FROM messages 
                WHERE conversation_id = ? AND sequence_num >= ? AND sequence_num < ?
                ORDER BY sequence_num ASC
            """, (conversation_id, max(1, sequence_num - window), sequence_num))
            before_rows = cursor.fetchall()
            before = [self._row_to_message(r) for r in before_rows]

            # After messages
            cursor.execute("""
                SELECT * FROM messages 
                WHERE conversation_id = ? AND sequence_num > ? AND sequence_num <= ?
                ORDER BY sequence_num ASC
            """, (conversation_id, sequence_num, sequence_num + window))
            after_rows = cursor.fetchall()
            after = [self._row_to_message(r) for r in after_rows]

        return before, after

    def filter_messages(
        self,
        conversation_id: Optional[str] = None,
        sender_name: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: int = 50,
    ) -> List[Message]:
        query = "SELECT * FROM messages WHERE 1=1"
        params = []
        if conversation_id:
            query += " AND conversation_id = ?"
            params.append(conversation_id)
        if sender_name:
            query += " AND sender_name LIKE ?"
            params.append(f"%{sender_name}%")
        if start_date:
            query += " AND timestamp >= ?"
            params.append(start_date)
        if end_date:
            query += " AND timestamp <= ?"
            params.append(end_date)

        query += " ORDER BY sequence_num ASC LIMIT ?"
        params.append(limit)

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            rows = cursor.fetchall()
            return [self._row_to_message(r) for r in rows]

    def count_messages(self, conversation_id: Optional[str] = None) -> int:
        query = "SELECT COUNT(*) FROM messages"
        params = []
        if conversation_id:
            query += " WHERE conversation_id = ?"
            params.append(conversation_id)
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            return cursor.fetchone()[0]

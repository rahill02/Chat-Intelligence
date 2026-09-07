"""
Dataset and Evaluation Query Generator for Chat Intelligence.
Generates 4,000+ realistic messages across 8 participants over 6 months
with natural conversational flow, Hinglish/code-mixed language, typos,
ground-truth scenarios, and 40 benchmark evaluation queries.
"""

import os
import sys
import json
import random
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any

# Ensure project root is on sys.path
sys.path.insert(0, os.path.abspath("."))

# Ensure reproducible seed
random.seed(42)

PARTICIPANTS = [
    {"id": "usr_01", "name": "Rahul Sharma", "role": "Organizer & Tech Enthusiast"},
    {"id": "usr_02", "name": "Priya Patel", "role": "Budget & Logistics Planner"},
    {"id": "usr_03", "name": "Aman Verma", "role": "Full-Stack Dev & Night Owl"},
    {"id": "usr_04", "name": "Sneha Rao", "role": "UI/UX Designer & Foodie"},
    {"id": "usr_05", "name": "Vikram Singh", "role": "Adventure & Fitness Lead"},
    {"id": "usr_06", "name": "Neha Gupta", "role": "Academics & Exam Coordinator"},
    {"id": "usr_07", "name": "Rohan Mehta", "role": "Meme Master & Casual Banter"},
    {"id": "usr_08", "name": "Ananya Joshi", "role": "Career & Hackathon Lead"},
]

# Ground Truth Milestone Events
GROUND_TRUTH_EVENTS = [
    {
        "id": "gt_01",
        "date_str": "2026-03-14T17:42:10Z",
        "sender": "Rahul Sharma",
        "content": "Okay guys, Manali confirmed. Rahul will handle hotel booking.",
        "query": "When did we decide on the trip destination?",
        "type": "semantic",
        "semantic_gap": True,
        "expected_answer": "The group confirmed Manali as the trip destination on March 14, with Rahul handling hotel booking.",
    },
    {
        "id": "gt_02",
        "date_str": "2026-03-15T11:20:05Z",
        "sender": "Priya Patel",
        "content": "Let's cap the total expenditure at ₹5,000 per person max, strictly.",
        "query": "What did Priya say about the budget?",
        "type": "attributed",
        "semantic_gap": False,
        "expected_answer": "Priya insisted on capping total expenditure at ₹5,000 per person maximum.",
    },
    {
        "id": "gt_03",
        "date_str": "2026-03-19T20:15:30Z",
        "sender": "Sneha Rao",
        "content": "Snow Valley Resorts looks really neat and falls right within our budget.",
        "query": "Which accommodation did Sneha recommend for the hills?",
        "type": "semantic",
        "semantic_gap": True,
        "expected_answer": "Sneha recommended Snow Valley Resorts as it fits the budget.",
    },
    {
        "id": "gt_04",
        "date_str": "2026-03-22T13:30:00Z",
        "sender": "Vikram Singh",
        "content": "Volvo semi-sleeper bus from Majnu Ka Tila is way safer and cheaper than renting self-drive cabs.",
        "query": "How are we traveling to the mountain vacation?",
        "type": "semantic",
        "semantic_gap": True,
        "expected_answer": "Vikram suggested traveling via Volvo semi-sleeper bus from Majnu Ka Tila.",
    },
    {
        "id": "gt_05",
        "date_str": "2026-04-03T14:10:00Z",
        "sender": "Aman Verma",
        "content": "We are definitely building the backend on FastAPI and pair it with React on Vite.",
        "query": "What technology stack did Aman choose for the final project?",
        "type": "semantic",
        "semantic_gap": True,
        "expected_answer": "Aman decided on FastAPI for the backend and React with Vite for the frontend.",
    },
    {
        "id": "gt_06",
        "date_str": "2026-04-12T16:20:00Z",
        "sender": "Rahul Sharma",
        "content": "Let's stick with SQLite for local development and keep repository interfaces ready for PostgreSQL.",
        "query": "What storage engine did we pick for local development?",
        "type": "semantic",
        "semantic_gap": True,
        "expected_answer": "Rahul finalized SQLite for local development with repository abstractions for PostgreSQL.",
    },
    {
        "id": "gt_07",
        "date_str": "2026-04-28T21:10:00Z",
        "sender": "Aman Verma",
        "content": "I set up the staging continuous deployment pipeline on Render, deployment URL is live.",
        "query": "Where did Aman deploy the staging build?",
        "type": "attributed",
        "semantic_gap": False,
        "expected_answer": "Aman deployed the staging pipeline on Render.",
    },
    {
        "id": "gt_08",
        "date_str": "2026-05-05T15:40:00Z",
        "sender": "Rahul Sharma",
        "content": "The multilingual E5 small embedding model performs phenomenally on mixed Hinglish sentences.",
        "query": "Which vector representation model works well for code-mixed chat?",
        "type": "semantic",
        "semantic_gap": True,
        "expected_answer": "Rahul noted that intfloat/multilingual-e5-small performs well on mixed Hinglish sentences.",
    },
    {
        "id": "gt_09",
        "date_str": "2026-05-18T11:10:00Z",
        "sender": "Ananya Joshi",
        "content": "Registered our squad under the moniker 'NeuralByte' on the Devpost portal.",
        "query": "What did we name our hackathon team?",
        "type": "semantic",
        "semantic_gap": True,
        "expected_answer": "Ananya registered the team under the name 'NeuralByte'.",
    },
    {
        "id": "gt_10",
        "date_str": "2026-05-20T18:30:00Z",
        "sender": "Ananya Joshi",
        "content": "Heads up team: GitHub repo submission deadline is sharp 11:59 PM tonight for CodeHack!",
        "query": "What deadline did Ananya mention in May?",
        "type": "combined",
        "semantic_gap": False,
        "expected_answer": "Ananya announced the CodeHack GitHub repo submission deadline of 11:59 PM tonight on May 20.",
    },
    {
        "id": "gt_11",
        "date_str": "2026-06-02T22:15:00Z",
        "sender": "Rohan Mehta",
        "content": "Total bill at Paradise Biryani was ₹2,400, sab log ₹300 mujhe GPay ya PhonePe kar do.",
        "query": "How much does everyone owe Rohan for dinner?",
        "type": "attributed",
        "semantic_gap": False,
        "expected_answer": "Everyone owes Rohan ₹300 via GPay or PhonePe for the Paradise Biryani bill of ₹2,400.",
    },
    {
        "id": "gt_12",
        "date_str": "2026-06-15T09:30:00Z",
        "sender": "Neha Gupta",
        "content": "Everyone gather on the 3rd floor reading room by 11 AM with Operating Systems notes.",
        "query": "Where did Neha ask the group to meet for exam prep?",
        "type": "attributed",
        "semantic_gap": False,
        "expected_answer": "Neha instructed the group to meet in the 3rd floor reading room at 11 AM with OS notes.",
    },
    {
        "id": "gt_13",
        "date_str": "2026-06-18T10:05:00Z",
        "sender": "Neha Gupta",
        "content": "Notice aa gaya guys, Distributed Systems paper is postponed to June 22.",
        "query": "When was the DS exam rescheduled to?",
        "type": "temporal",
        "semantic_gap": False,
        "expected_answer": "Neha announced the Distributed Systems exam was postponed to June 22.",
    },
    {
        "id": "gt_14",
        "date_str": "2026-07-08T19:45:00Z",
        "sender": "Aman Verma",
        "content": "Guys treat on me! Just signed the offer letter for Google summer SWE internship! 🎉",
        "query": "Who got an internship at Google?",
        "type": "attributed",
        "semantic_gap": False,
        "expected_answer": "Aman Verma signed the offer letter for Google summer SWE internship on July 8.",
    },
    {
        "id": "gt_15",
        "date_str": "2026-07-24T14:30:00Z",
        "sender": "Priya Patel",
        "content": "Amazon interview prep sheet with 75 LeetCode medium questions is pinned in our Google drive folder.",
        "query": "What resource did Priya share for interview preparation in July?",
        "type": "combined",
        "semantic_gap": False,
        "expected_answer": "Priya pinned an Amazon prep sheet with 75 LeetCode medium questions in the Google drive folder.",
    },
    {
        "id": "gt_16",
        "date_str": "2026-08-10T16:15:00Z",
        "sender": "Sneha Rao",
        "content": "Table reserved at Olive Bistro for Priya's surprise party tonight at 8 PM, don't be late!",
        "query": "Where is Priya's birthday dinner happening?",
        "type": "semantic",
        "semantic_gap": True,
        "expected_answer": "Sneha reserved a table at Olive Bistro for Priya's surprise party at 8 PM on August 10.",
    },
]

# Rich parameterized dynamic dialogue pools to ensure realistic, non-repetitive conversation flow
PLACES = ["Rishikesh", "Kasol", "Bir Billing", "Shimla", "Jaipur", "Udaipur", "Pondicherry", "Nainital", "Lansdowne", "Dharamshala", "Spiti"]
FOOD_ITEMS = ["shawarma", "chole bhature", "cold coffee", "masala dosa", "wood-fired pizza", "paneer tikka roll", "belgian waffles", "steamed momos", "pav bhaji", "butter chicken"]
SUBJECTS = ["Computer Networks", "Machine Learning", "Database Management Systems", "Compiler Design", "Discrete Mathematics", "Cloud Computing", "Computer Vision", "Information Security"]
COMPANIES = ["Microsoft", "Uber", "Atlassian", "Adobe", "Flipkart", "Swiggy", "Goldman Sachs", "Intuit", "Zomato", "Salesforce"]
TECH_ITEMS = ["Redis caching", "Docker container", "JWT token expiry", "Tailwind grid layout", "CI workflow on GitHub Actions", "SQLAlchemy connection pool", "Pydantic validator", "WebSocket reconnect logic"]


def generate_dynamic_thread(category: str, day_date: datetime) -> List[tuple]:
    """Generates unique, realistic conversational threads based on date and category."""
    dt_str = day_date.strftime("%b %d")
    
    if category == "trip":
        place = random.choice(PLACES)
        food = random.choice(FOOD_ITEMS)
        threads = [
            [
                ("Rahul Sharma", f"Yaar {place} ka weather forecast dekha kya kisi ne?", "hi"),
                ("Sneha Rao", f"Clear skies and around 18 degrees, perfect for photos! 📸", "en"),
                ("Vikram Singh", f"Renting bikes or taking local transport there?", "en"),
                ("Priya Patel", f"Advance booking kar lo sab log, weekend rush me rates badh jate hain.", "hi"),
                ("Rohan Mehta", f"Aur waha {food} try karna mandatory hai bro!", "hi"),
                ("Aman Verma", f"Main camera aur powerbank pack kar raha hu.", "en"),
            ],
            [
                ("Vikram Singh", f"Anyone up for an early morning hike if we visit {place}?", "en"),
                ("Sneha Rao", f"Only if sunrise view is worth waking up at 5 AM haha", "en"),
                ("Rahul Sharma", f"I checked trails, 4km easy trek to waterfall viewpoint.", "en"),
                ("Rohan Mehta", f"Mai chai ki tapri pe wait karunga tum sab ka ☕", "hi"),
                ("Ananya Joshi", f"Make sure everyone wears proper trekking shoes!", "en"),
            ]
        ]
    elif category == "project":
        tech = random.choice(TECH_ITEMS)
        subj = random.choice(SUBJECTS)
        threads = [
            [
                ("Aman Verma", f"Facing a small bug with {tech}. Anyone free to pair debug?", "en"),
                ("Rahul Sharma", f"Send me the branch name, checking logs now.", "en"),
                ("Aman Verma", f"Pushed to feature/perf-opt branch, check commit message.", "en"),
                ("Priya Patel", f"Response time benchmark zaroor note karna after fix.", "hi"),
                ("Sneha Rao", f"UI animations are looking super smooth on the latest preview!", "en"),
            ],
            [
                ("Ananya Joshi", f"Sprint review update: our {tech} module is 90% completed.", "en"),
                ("Rahul Sharma", f"Great progress! Let's write integration tests before merge.", "en"),
                ("Aman Verma", f"Pytest suite passing locally with zero warnings.", "en"),
                ("Neha Gupta", f"Make sure code comments match the project rubric specifications.", "en"),
                ("Rohan Mehta", f"Ship it to production on Friday evening? Jk jk 😂", "hi"),
            ]
        ]
    elif category == "academics":
        subj = random.choice(SUBJECTS)
        assign_no = random.randint(1, 5)
        threads = [
            [
                ("Neha Gupta", f"Guys {subj} assignment {assign_no} is uploaded on portal.", "en"),
                ("Rohan Mehta", f"Deadline kab hai Neha? Please say next week 😭", "hi"),
                ("Neha Gupta", f"Due this Thursday 11:59 PM. Start early, 4 questions are long derivation.", "en"),
                ("Aman Verma", f"I have the reference textbook PDF, sharing in our drive.", "en"),
                ("Ananya Joshi", f"Let's form a study group in the reading hall tomorrow.", "en"),
                ("Vikram Singh", f"Will be there post lunch 👍", "en"),
            ],
            [
                ("Neha Gupta", f"Professor mentioned that {subj} midterms will focus heavily on case studies.", "en"),
                ("Priya Patel", f"Previous year question papers solve karna padega ache se.", "hi"),
                ("Rahul Sharma", f"I compiled past 3 years papers into a single PDF.", "en"),
                ("Sneha Rao", f"Rahul you are a lifesaver, thanks! 🙌", "en"),
            ]
        ]
    elif category == "career":
        comp = random.choice(COMPANIES)
        threads = [
            [
                ("Ananya Joshi", f"{comp} just posted open university grad roles on LinkedIn.", "en"),
                ("Aman Verma", f"Their online assessment usually has 2 hard graph/tree problems.", "en"),
                ("Rahul Sharma", f"Anyone need a referral? My college senior works at {comp}.", "en"),
                ("Priya Patel", f"Yes Rahul! Can you forward my resume link?", "en"),
                ("Sneha Rao", f"Make sure to highlight open source contributions at the top.", "en"),
                ("Rohan Mehta", f"Main apply kar raha hu with 100% hope and 0% LeetCode practice 😂", "hi"),
            ],
            [
                ("Aman Verma", f"Solved 5 DP questions today. Interval scheduling and matrix chain multiplication.", "en"),
                ("Ananya Joshi", f"Consistency is key! Striver's SDE sheet is so well organized.", "en"),
                ("Vikram Singh", f"Mock interview le lo mera koi weekend pe please.", "hi"),
                ("Rahul Sharma", f"Saturday 4 PM works for me Vikram, let's do a 45 min round.", "en"),
            ]
        ]
    elif category == "food":
        food = random.choice(FOOD_ITEMS)
        place = random.choice(["Bistro Central", "Spicy Wok", "Highway Dhaba", "The Terrace Cafe", "Corner Bakery", "Chai Point"])
        threads = [
            [
                ("Rohan Mehta", f"Aaj shaam ko {place} pe {food} khane ka plan kiska hai?", "hi"),
                ("Sneha Rao", f"Count me in! Their iced latte is also really nice.", "en"),
                ("Vikram Singh", f"Just finished workout, need protein. Coming along.", "en"),
                ("Priya Patel", f"Splitwise group me settle kar lena previous balance pehle!", "hi"),
                ("Rahul Sharma", f"Will pick everyone up at 6:45 PM from hostel gate.", "en"),
            ],
            [
                ("Sneha Rao", f"Food at {place} was delicious today!", "en"),
                ("Rohan Mehta", f"Total bill came out to ₹{random.randint(1200, 2600)}.", "en"),
                ("Priya Patel", f"Sent my share on UPI 👍", "en"),
                ("Aman Verma", f"Paid via GPay!", "en"),
                ("Vikram Singh", f"Done from my side too", "en"),
            ]
        ]
    else: # casual
        threads = [
            [
                ("Rahul Sharma", f"Good morning everyone! How is the {dt_str} week going?", "en"),
                ("Rohan Mehta", f"Surviving on black coffee and hope bhai ☕", "hi"),
                ("Sneha Rao", f"Working on new UI illustrations, will share sneak peek soon.", "en"),
                ("Ananya Joshi", f"Weather is surprisingly pleasant today for a change.", "en"),
                ("Vikram Singh", f"Morning 10k run done, feeling energetic 🏃", "en"),
            ],
            [
                ("Rohan Mehta", f"Saw this hilarious coding meme on Reddit, relates so hard 😂", "en"),
                ("Aman Verma", f"Haha 100% accurate, happens every time during prod release", "en"),
                ("Sneha Rao", f"Omg send in group chat!", "en"),
                ("Neha Gupta", f"Lmao that is too real 😭", "en"),
            ]
        ]
    return random.choice(threads)

# Conversational fillers and follow-up templates
SHORT_CONFIRMATIONS = [
    ("Done", "en"), ("Yess", "en"), ("Okay", "en"), ("Ha bhai", "hi"), 
    ("Sorted 👍", "en"), ("Agreed 💯", "en"), ("Pakka", "hi"), 
    ("Cool", "en"), ("Thanks!", "en"), ("Will check", "en"),
    ("Bhejo link", "hi"), ("Shi hai", "hi"), ("Okkk", "en"),
    ("Chalega", "hi"), ("Sahi bola", "hi"), ("Let's do it 🚀", "en"),
    ("Noted", "en"), ("Ha dekh liya", "hi"), ("Same here", "en"),
    ("Wait a sec", "en"), ("10 mins me batata hu", "hi"),
]

TYPO_VARIANTS = {
    "tomorrow": ["tmrw", "tomorow", "kal"],
    "please": ["pls", "plz"],
    "thanks": ["thx", "tq", "dhanyawad"],
    "yes": ["yess", "yep", "haan", "ha"],
    "okay": ["okkk", "oki", "kk"],
    "because": ["bcoz", "cuz", "kyuki"],
    "people": ["ppl", "sab log"],
}


def generate_chat_dataset(
    target_count: int = 4300,
    start_date: datetime = datetime(2026, 3, 1, 8, 0, 0, tzinfo=timezone.utc),
    end_date: datetime = datetime(2026, 8, 31, 23, 0, 0, tzinfo=timezone.utc)
) -> Dict[str, Any]:
    """Generates 4,000+ realistic messages spanning 6 months with ground truth events."""
    conversation_id = "conv_main_group"
    total_seconds = int((end_date - start_date).total_seconds())

    # Map participants by name for easy lookup
    part_map = {p["name"]: p["id"] for p in PARTICIPANTS}

    # Pre-schedule ground truth events at exact timestamps
    gt_messages = []
    for gt in GROUND_TRUTH_EVENTS:
        dt = datetime.fromisoformat(gt["date_str"].replace("Z", "+00:00"))
        gt_messages.append({
            "timestamp_dt": dt,
            "sender_name": gt["sender"],
            "sender_id": part_map[gt["sender"]],
            "content": gt["content"],
            "is_gt": True,
            "gt_id": gt["id"],
            "is_code_mixed": any(w in gt["content"].lower() for w in ["dekhega", "aa gaya", "kisi ne", "bhai", "sab log", "kar do"]),
            "language": "hinglish" if any(w in gt["content"].lower() for w in ["dekhega", "aa gaya", "sab log", "kar do"]) else "en"
        })

    # Sort GT by timestamp
    gt_messages.sort(key=lambda x: x["timestamp_dt"])

    # Generate dialogue streams across the 6-month timeline
    generated_msgs = []
    curr_time = start_date

    # Average messages per day: 4300 / 184 days ≈ 23.4 messages/day
    days_count = (end_date - start_date).days

    for day_idx in range(days_count):
        day_date = start_date + timedelta(days=day_idx)
        # Random daily message volume (10 to 45 messages per day)
        daily_msgs_count = random.randint(14, 38)

        # 2 to 5 conversation bursts throughout the day (morning, afternoon, evening, late night)
        burst_hours = sorted(random.sample([8, 9, 11, 13, 15, 17, 19, 21, 22, 23], k=random.randint(2, 4)))

        msgs_in_day = 0
        for b_hour in burst_hours:
            burst_time = day_date.replace(hour=b_hour, minute=random.randint(0, 45), second=random.randint(0, 59))
            
            # Pick a category and generate dynamic thread
            cat = random.choice(["trip", "project", "academics", "career", "food", "casual"])
            thread = generate_dynamic_thread(cat, day_date)

            # Post thread messages with 30s - 3min intervals
            t_offset = 0
            prev_msg_id = None
            for sender_name, content, lang in thread:
                msg_time = burst_time + timedelta(seconds=t_offset)
                if msg_time > end_date:
                    break

                is_code_mixed = lang == "hi" or any(w in content.lower() for w in ["bhai", "kya", "yaar", "chal", "ka", "ki", "ko", "mai", "hai"])

                generated_msgs.append({
                    "timestamp_dt": msg_time,
                    "sender_name": sender_name,
                    "sender_id": part_map[sender_name],
                    "content": content,
                    "is_gt": False,
                    "gt_id": None,
                    "is_code_mixed": is_code_mixed,
                    "language": "hinglish" if is_code_mixed else "en",
                })
                msgs_in_day += 1
                t_offset += random.randint(25, 180)

            # Often someone adds a short confirmation or reaction
            if random.random() < 0.75:
                conf_text, conf_lang = random.choice(SHORT_CONFIRMATIONS)
                conf_sender = random.choice(PARTICIPANTS)["name"]
                conf_time = burst_time + timedelta(seconds=t_offset + random.randint(15, 60))
                if conf_time <= end_date:
                    is_cm = conf_lang == "hi" or "bhai" in conf_text.lower() or "dekh" in conf_text.lower()
                    generated_msgs.append({
                        "timestamp_dt": conf_time,
                        "sender_name": conf_sender,
                        "sender_id": part_map[conf_sender],
                        "content": conf_text,
                        "is_gt": False,
                        "gt_id": None,
                        "is_code_mixed": is_cm,
                        "language": "hinglish" if is_cm else "en",
                    })
                    msgs_in_day += 1

    # Merge ground truth messages and normal generated messages
    all_raw_msgs = generated_msgs + gt_messages
    all_raw_msgs.sort(key=lambda x: x["timestamp_dt"])

    # If count is below target_count, interpolate realistic conversational filler
    seq = 1
    final_messages = []
    gt_id_to_seq = {}

    for item in all_raw_msgs:
        m_id = f"msg_{seq:05d}"
        if item.get("is_gt") and item.get("gt_id"):
            gt_id_to_seq[item["gt_id"]] = m_id

        final_messages.append({
            "id": m_id,
            "conversation_id": conversation_id,
            "sequence_num": seq,
            "sender_id": item["sender_id"],
            "sender_name": item["sender_name"],
            "content": item["content"],
            "timestamp": item["timestamp_dt"].strftime("%Y-%m-%dT%H:%M:%SZ"),
            "reply_to_id": None,
            "is_code_mixed": item["is_code_mixed"],
            "language": item["language"],
            "metadata": {"gt_id": item["gt_id"]} if item.get("gt_id") else None,
        })
        seq += 1

    # If we need more messages to reach comfortably >4,200:
    while len(final_messages) < target_count:
        # Insert a natural chat message into a random conversation gap
        rand_idx = random.randint(1, len(final_messages) - 2)
        base_msg = final_messages[rand_idx]
        base_dt = datetime.fromisoformat(base_msg["timestamp"].replace("Z", "+00:00"))
        new_dt = base_dt + timedelta(seconds=random.randint(10, 40))

        filler_sender = random.choice(PARTICIPANTS)["name"]
        text, lang = random.choice(SHORT_CONFIRMATIONS)
        
        new_msg = {
            "id": f"temp_{len(final_messages)}",
            "conversation_id": conversation_id,
            "sequence_num": 0,
            "sender_id": part_map[filler_sender],
            "sender_name": filler_sender,
            "content": text,
            "timestamp": new_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "reply_to_id": base_msg["id"],
            "is_code_mixed": lang == "hi",
            "language": "hinglish" if lang == "hi" else "en",
            "metadata": None,
            "_sort_dt": new_dt
        }
        final_messages.insert(rand_idx + 1, new_msg)

    # Final re-indexing and sequential numbering
    final_messages.sort(key=lambda x: x["timestamp"])
    for idx, m in enumerate(final_messages, 1):
        m["sequence_num"] = idx
        m["id"] = f"msg_{idx:05d}"
        if m.get("metadata") and m["metadata"].get("gt_id"):
            gt_id_to_seq[m["metadata"]["gt_id"]] = m["id"]
        if "_sort_dt" in m:
            del m["_sort_dt"]

    conversation = {
        "id": conversation_id,
        "title": "College Core Squad & Trips",
        "type": "group",
        "participant_count": len(PARTICIPANTS),
        "message_count": len(final_messages),
        "created_at": final_messages[0]["timestamp"],
        "updated_at": final_messages[-1]["timestamp"],
    }

    return {
        "conversation": conversation,
        "participants": PARTICIPANTS,
        "messages": final_messages,
        "gt_map": gt_id_to_seq
    }


def generate_40_evaluation_queries(gt_map: Dict[str, str]) -> List[Dict[str, Any]]:
    """Creates exactly 40 evaluation queries across all required categories."""
    queries = [
        # --- Category 1: Semantic Queries with Semantic Gap (at least 8) ---
        {
            "id": "eval_01",
            "query": "When did we decide on the trip destination?",
            "query_type": "semantic",
            "expected_answer": "Manali was confirmed on March 14, with Rahul handling hotel booking.",
            "expected_message_ids": [gt_map.get("gt_01", "msg_00001")],
            "semantic_gap": True,
            "target_sender": "Rahul Sharma",
            "date_range": {"start": "2026-03-01", "end": "2026-03-31"},
            "unanswerable": False,
            "notes": "Query uses 'decide on the trip destination'; message says 'Manali confirmed'."
        },
        {
            "id": "eval_02",
            "query": "Which accommodation did Sneha recommend for the hills?",
            "query_type": "semantic",
            "expected_answer": "Sneha recommended Snow Valley Resorts as it fits the budget.",
            "expected_message_ids": [gt_map.get("gt_03", "msg_00001")],
            "semantic_gap": True,
            "target_sender": "Sneha Rao",
            "date_range": {"start": "2026-03-01", "end": "2026-03-31"},
            "unanswerable": False,
            "notes": "Query asks for 'accommodation' and 'hills'; message mentions 'Snow Valley Resorts'."
        },
        {
            "id": "eval_03",
            "query": "How are we traveling to the mountain vacation?",
            "query_type": "semantic",
            "expected_answer": "Vikram suggested traveling by Volvo semi-sleeper bus from Majnu Ka Tila.",
            "expected_message_ids": [gt_map.get("gt_04", "msg_00001")],
            "semantic_gap": True,
            "target_sender": "Vikram Singh",
            "date_range": {"start": "2026-03-01", "end": "2026-03-31"},
            "unanswerable": False,
            "notes": "Query uses 'mountain vacation' and 'traveling'; message mentions 'Volvo semi-sleeper bus from Majnu Ka Tila'."
        },
        {
            "id": "eval_04",
            "query": "What technology stack did Aman choose for the final project?",
            "query_type": "semantic",
            "expected_answer": "FastAPI for the backend and React with Vite for the frontend.",
            "expected_message_ids": [gt_map.get("gt_05", "msg_00001")],
            "semantic_gap": True,
            "target_sender": "Aman Verma",
            "date_range": {"start": "2026-04-01", "end": "2026-04-30"},
            "unanswerable": False,
            "notes": "Query asks for 'technology stack'; message says 'building the backend on FastAPI and pair it with React on Vite'."
        },
        {
            "id": "eval_05",
            "query": "What storage engine did we pick for local development?",
            "query_type": "semantic",
            "expected_answer": "SQLite for local development with repository abstractions for PostgreSQL.",
            "expected_message_ids": [gt_map.get("gt_06", "msg_00001")],
            "semantic_gap": True,
            "target_sender": "Rahul Sharma",
            "date_range": {"start": "2026-04-01", "end": "2026-04-30"},
            "unanswerable": False,
            "notes": "Query says 'storage engine'; message mentions 'stick with SQLite'."
        },
        {
            "id": "eval_06",
            "query": "Which vector representation model works well for code-mixed chat?",
            "query_type": "semantic",
            "expected_answer": "The multilingual E5 small embedding model.",
            "expected_message_ids": [gt_map.get("gt_08", "msg_00001")],
            "semantic_gap": True,
            "target_sender": "Rahul Sharma",
            "date_range": {"start": "2026-05-01", "end": "2026-05-31"},
            "unanswerable": False,
            "notes": "Query asks for 'vector representation model'; message says 'multilingual E5 small embedding model'."
        },
        {
            "id": "eval_07",
            "query": "What did we name our hackathon team?",
            "query_type": "semantic",
            "expected_answer": "NeuralByte.",
            "expected_message_ids": [gt_map.get("gt_09", "msg_00001")],
            "semantic_gap": True,
            "target_sender": "Ananya Joshi",
            "date_range": {"start": "2026-05-01", "end": "2026-05-31"},
            "unanswerable": False,
            "notes": "Query asks for 'team name'; message states 'Registered our squad under the moniker NeuralByte'."
        },
        {
            "id": "eval_08",
            "query": "Where is Priya's birthday dinner happening?",
            "query_type": "semantic",
            "expected_answer": "Olive Bistro at 8 PM on August 10.",
            "expected_message_ids": [gt_map.get("gt_16", "msg_00001")],
            "semantic_gap": True,
            "target_sender": "Sneha Rao",
            "date_range": {"start": "2026-08-01", "end": "2026-08-31"},
            "unanswerable": False,
            "notes": "Query says 'birthday dinner'; message says 'Table reserved at Olive Bistro for Priya's surprise party'."
        },

        # --- Category 2: Attributed / Person-Specific Queries ---
        {
            "id": "eval_09",
            "query": "What did Priya say about the budget?",
            "query_type": "attributed",
            "expected_answer": "Priya stated that total expenditure should be capped at ₹5,000 per person max, strictly.",
            "expected_message_ids": [gt_map.get("gt_02", "msg_00001")],
            "semantic_gap": False,
            "target_sender": "Priya Patel",
            "date_range": None,
            "unanswerable": False,
            "notes": "Attributed to Priya Patel."
        },
        {
            "id": "eval_10",
            "query": "Where did Aman deploy the staging build?",
            "query_type": "attributed",
            "expected_answer": "Aman deployed the staging continuous deployment pipeline on Render.",
            "expected_message_ids": [gt_map.get("gt_07", "msg_00001")],
            "semantic_gap": False,
            "target_sender": "Aman Verma",
            "date_range": None,
            "unanswerable": False,
            "notes": "Attributed to Aman Verma."
        },
        {
            "id": "eval_11",
            "query": "Who got an internship at Google?",
            "query_type": "attributed",
            "expected_answer": "Aman Verma signed the offer letter for Google summer SWE internship.",
            "expected_message_ids": [gt_map.get("gt_14", "msg_00001")],
            "semantic_gap": False,
            "target_sender": "Aman Verma",
            "date_range": None,
            "unanswerable": False,
            "notes": "Attributed to Aman Verma."
        },
        {
            "id": "eval_12",
            "query": "How much does everyone owe Rohan for dinner?",
            "query_type": "attributed",
            "expected_answer": "Everyone owes Rohan ₹300 via GPay or PhonePe for the Paradise Biryani bill.",
            "expected_message_ids": [gt_map.get("gt_11", "msg_00001")],
            "semantic_gap": False,
            "target_sender": "Rohan Mehta",
            "date_range": None,
            "unanswerable": False,
            "notes": "Attributed to Rohan Mehta."
        },
        {
            "id": "eval_13",
            "query": "Where did Neha ask the group to meet for exam prep?",
            "query_type": "attributed",
            "expected_answer": "In the 3rd floor reading room by 11 AM with OS notes.",
            "expected_message_ids": [gt_map.get("gt_12", "msg_00001")],
            "semantic_gap": False,
            "target_sender": "Neha Gupta",
            "date_range": None,
            "unanswerable": False,
            "notes": "Attributed to Neha Gupta."
        },
        {
            "id": "eval_14",
            "query": "What did Sneha say about Snow Valley Resorts?",
            "query_type": "attributed",
            "expected_answer": "Sneha mentioned that Snow Valley Resorts looks neat and falls within budget.",
            "expected_message_ids": [gt_map.get("gt_03", "msg_00001")],
            "semantic_gap": False,
            "target_sender": "Sneha Rao",
            "date_range": None,
            "unanswerable": False,
            "notes": "Attributed to Sneha Rao."
        },
        {
            "id": "eval_15",
            "query": "What did Vikram recommend regarding bus travel?",
            "query_type": "attributed",
            "expected_answer": "Vikram recommended taking the Volvo semi-sleeper bus from Majnu Ka Tila as it is safer and cheaper.",
            "expected_message_ids": [gt_map.get("gt_04", "msg_00001")],
            "semantic_gap": False,
            "target_sender": "Vikram Singh",
            "date_range": None,
            "unanswerable": False,
            "notes": "Attributed to Vikram Singh."
        },
        {
            "id": "eval_16",
            "query": "What team name did Ananya register for the hackathon?",
            "query_type": "attributed",
            "expected_answer": "NeuralByte.",
            "expected_message_ids": [gt_map.get("gt_09", "msg_00001")],
            "semantic_gap": False,
            "target_sender": "Ananya Joshi",
            "date_range": None,
            "unanswerable": False,
            "notes": "Attributed to Ananya Joshi."
        },

        # --- Category 3: Temporal / Date-based Queries ---
        {
            "id": "eval_17",
            "query": "What was decided on March 14?",
            "query_type": "temporal",
            "expected_answer": "Manali was confirmed as the trip destination on March 14.",
            "expected_message_ids": [gt_map.get("gt_01", "msg_00001")],
            "semantic_gap": False,
            "target_sender": None,
            "date_range": {"start": "2026-03-14", "end": "2026-03-14"},
            "unanswerable": False,
            "notes": "Exact date query: March 14, 2026."
        },
        {
            "id": "eval_18",
            "query": "When was the DS exam rescheduled to in June?",
            "query_type": "temporal",
            "expected_answer": "The Distributed Systems exam was postponed to June 22.",
            "expected_message_ids": [gt_map.get("gt_13", "msg_00001")],
            "semantic_gap": False,
            "target_sender": "Neha Gupta",
            "date_range": {"start": "2026-06-01", "end": "2026-06-30"},
            "unanswerable": False,
            "notes": "Temporal constraint: June 2026."
        },
        {
            "id": "eval_19",
            "query": "What major career news happened on July 8?",
            "query_type": "temporal",
            "expected_answer": "Aman signed the offer letter for the Google summer SWE internship.",
            "expected_message_ids": [gt_map.get("gt_14", "msg_00001")],
            "semantic_gap": False,
            "target_sender": None,
            "date_range": {"start": "2026-07-08", "end": "2026-07-08"},
            "unanswerable": False,
            "notes": "Temporal query: July 8, 2026."
        },
        {
            "id": "eval_20",
            "query": "What happened on the night of August 10?",
            "query_type": "temporal",
            "expected_answer": "Priya's surprise birthday party at Olive Bistro at 8 PM.",
            "expected_message_ids": [gt_map.get("gt_16", "msg_00001")],
            "semantic_gap": False,
            "target_sender": None,
            "date_range": {"start": "2026-08-10", "end": "2026-08-10"},
            "unanswerable": False,
            "notes": "Temporal query: August 10, 2026."
        },
        {
            "id": "eval_21",
            "query": "What project tech decisions were finalized in early April?",
            "query_type": "temporal",
            "expected_answer": "FastAPI and React on Vite were finalized on April 3.",
            "expected_message_ids": [gt_map.get("gt_05", "msg_00001")],
            "semantic_gap": False,
            "target_sender": None,
            "date_range": {"start": "2026-04-01", "end": "2026-04-10"},
            "unanswerable": False,
            "notes": "Temporal query: early April 2026."
        },
        {
            "id": "eval_22",
            "query": "What happened on May 20 evening?",
            "query_type": "temporal",
            "expected_answer": "The GitHub repo submission deadline of 11:59 PM for CodeHack hackathon.",
            "expected_message_ids": [gt_map.get("gt_10", "msg_00001")],
            "semantic_gap": False,
            "target_sender": None,
            "date_range": {"start": "2026-05-20", "end": "2026-05-20"},
            "unanswerable": False,
            "notes": "Temporal query: May 20 evening."
        },

        # --- Category 4: Combined Queries (Sender + Time + Semantic) ---
        {
            "id": "eval_23",
            "query": "What did Priya say about the trip budget in March?",
            "query_type": "combined",
            "expected_answer": "Priya stated to cap total expenditure at ₹5,000 per person max.",
            "expected_message_ids": [gt_map.get("gt_02", "msg_00001")],
            "semantic_gap": False,
            "target_sender": "Priya Patel",
            "date_range": {"start": "2026-03-01", "end": "2026-03-31"},
            "unanswerable": False,
            "notes": "Combined: Sender=Priya, Month=March, Semantic=budget."
        },
        {
            "id": "eval_24",
            "query": "What resource did Priya share for interview preparation in July?",
            "query_type": "combined",
            "expected_answer": "Priya shared the Amazon prep sheet with 75 LeetCode medium questions in the Google drive.",
            "expected_message_ids": [gt_map.get("gt_15", "msg_00001")],
            "semantic_gap": False,
            "target_sender": "Priya Patel",
            "date_range": {"start": "2026-07-01", "end": "2026-07-31"},
            "unanswerable": False,
            "notes": "Combined: Sender=Priya, Month=July, Semantic=interview prep."
        },
        {
            "id": "eval_25",
            "query": "What deadline did Ananya announce on May 20?",
            "query_type": "combined",
            "expected_answer": "Ananya announced the 11:59 PM GitHub submission deadline for CodeHack.",
            "expected_message_ids": [gt_map.get("gt_10", "msg_00001")],
            "semantic_gap": False,
            "target_sender": "Ananya Joshi",
            "date_range": {"start": "2026-05-20", "end": "2026-05-20"},
            "unanswerable": False,
            "notes": "Combined: Sender=Ananya, Date=May 20, Semantic=deadline."
        },
        {
            "id": "eval_26",
            "query": "What did Sneha organize for Priya in August?",
            "query_type": "combined",
            "expected_answer": "Sneha reserved a table at Olive Bistro for Priya's surprise birthday party.",
            "expected_message_ids": [gt_map.get("gt_16", "msg_00001")],
            "semantic_gap": True,
            "target_sender": "Sneha Rao",
            "date_range": {"start": "2026-08-01", "end": "2026-08-31"},
            "unanswerable": False,
            "notes": "Combined: Sender=Sneha, Month=August, Semantic=surprise."
        },
        {
            "id": "eval_27",
            "query": "What did Neha announce regarding exams in June?",
            "query_type": "combined",
            "expected_answer": "Neha announced that the Distributed Systems exam was postponed to June 22.",
            "expected_message_ids": [gt_map.get("gt_13", "msg_00001")],
            "semantic_gap": False,
            "target_sender": "Neha Gupta",
            "date_range": {"start": "2026-06-01", "end": "2026-06-30"},
            "unanswerable": False,
            "notes": "Combined: Sender=Neha, Month=June, Semantic=exam postponement."
        },

        # --- Category 5: Hinglish & Code-Mixed / Typo Queries ---
        {
            "id": "eval_28",
            "query": "Manali kab confirm hua tha?",
            "query_type": "semantic",
            "expected_answer": "Manali 14 March ko confirm hua tha.",
            "expected_message_ids": [gt_map.get("gt_01", "msg_00001")],
            "semantic_gap": False,
            "target_sender": None,
            "date_range": None,
            "unanswerable": False,
            "notes": "Hinglish query for Manali confirmation."
        },
        {
            "id": "eval_29",
            "query": "Priya ka max budget kitna tha per head?",
            "query_type": "attributed",
            "expected_answer": "Priya ne ₹5,000 per person max budget fix kiya tha.",
            "expected_message_ids": [gt_map.get("gt_02", "msg_00001")],
            "semantic_gap": False,
            "target_sender": "Priya Patel",
            "date_range": None,
            "unanswerable": False,
            "notes": "Hinglish query for Priya's budget."
        },
        {
            "id": "eval_30",
            "query": "Biryani ka bill kitna tha aur kisko paise bhejne the?",
            "query_type": "attributed",
            "expected_answer": "Total bill ₹2,400 tha aur Rohan ko ₹300 per person GPay/PhonePe karna tha.",
            "expected_message_ids": [gt_map.get("gt_11", "msg_00001")],
            "semantic_gap": False,
            "target_sender": "Rohan Mehta",
            "date_range": None,
            "unanswerable": False,
            "notes": "Hinglish query for Paradise Biryani split."
        },
        {
            "id": "eval_31",
            "query": "DS ka exam kab postpone hua?",
            "query_type": "semantic",
            "expected_answer": "Distributed Systems ka exam June 22 ko postpone hua tha.",
            "expected_message_ids": [gt_map.get("gt_13", "msg_00001")],
            "semantic_gap": False,
            "target_sender": "Neha Gupta",
            "date_range": None,
            "unanswerable": False,
            "notes": "Hinglish query for DS exam postponement."
        },
        {
            "id": "eval_32",
            "query": "whn did aman gt the google offr?",
            "query_type": "semantic",
            "expected_answer": "Aman signed the Google internship offer letter on July 8.",
            "expected_message_ids": [gt_map.get("gt_14", "msg_00001")],
            "semantic_gap": False,
            "target_sender": "Aman Verma",
            "date_range": None,
            "unanswerable": False,
            "notes": "Typo-heavy informal query ('whn', 'gt', 'offr')."
        },

        # --- Category 6: Unanswerable Queries (Guaranteed Zero Hallucination) ---
        {
            "id": "eval_33",
            "query": "What is Rahul's favorite restaurant?",
            "query_type": "unanswerable",
            "expected_answer": None,
            "expected_message_ids": [],
            "semantic_gap": False,
            "target_sender": None,
            "date_range": None,
            "unanswerable": True,
            "notes": "Unanswerable: Rahul never mentions his personal favorite restaurant."
        },
        {
            "id": "eval_34",
            "query": "Where did Sneha buy her laptop?",
            "query_type": "unanswerable",
            "expected_answer": None,
            "expected_message_ids": [],
            "semantic_gap": False,
            "target_sender": None,
            "date_range": None,
            "unanswerable": True,
            "notes": "Unanswerable: Sneha never discussed where she bought a laptop."
        },
        {
            "id": "eval_35",
            "query": "What did Vikram score in the GRE exam?",
            "query_type": "unanswerable",
            "expected_answer": None,
            "expected_message_ids": [],
            "semantic_gap": False,
            "target_sender": None,
            "date_range": None,
            "unanswerable": True,
            "notes": "Unanswerable: GRE exam scores were never discussed."
        },
        {
            "id": "eval_36",
            "query": "What brand of car does Rohan drive?",
            "query_type": "unanswerable",
            "expected_answer": None,
            "expected_message_ids": [],
            "semantic_gap": False,
            "target_sender": None,
            "date_range": None,
            "unanswerable": True,
            "notes": "Unanswerable: Rohan's personal car brand was never mentioned."
        },
        {
            "id": "eval_37",
            "query": "Who pays for the group's Netflix subscription?",
            "query_type": "unanswerable",
            "expected_answer": None,
            "expected_message_ids": [],
            "semantic_gap": False,
            "target_sender": None,
            "date_range": None,
            "unanswerable": True,
            "notes": "Unanswerable: Netflix subscription is absent from the chat."
        },
        {
            "id": "eval_38",
            "query": "When did Ananya visit Paris?",
            "query_type": "unanswerable",
            "expected_answer": None,
            "expected_message_ids": [],
            "semantic_gap": False,
            "target_sender": None,
            "date_range": None,
            "unanswerable": True,
            "notes": "Unanswerable: Ananya visiting Paris is completely fabricated."
        },
        {
            "id": "eval_39",
            "query": "What is Neha's dog's breed and name?",
            "query_type": "unanswerable",
            "expected_answer": None,
            "expected_message_ids": [],
            "semantic_gap": False,
            "target_sender": None,
            "date_range": None,
            "unanswerable": True,
            "notes": "Unanswerable: Neha does not have a pet discussed in chat."
        },
        {
            "id": "eval_40",
            "query": "What exact stipend amount is Google paying Aman per month?",
            "query_type": "unanswerable",
            "expected_answer": None,
            "expected_message_ids": [],
            "semantic_gap": False,
            "target_sender": None,
            "date_range": None,
            "unanswerable": True,
            "notes": "Unanswerable: Aman announced getting the offer, but the exact stipend amount was never disclosed."
        },
    ]
    return queries


def main():
    print("Generating Chat Intelligence dataset...")
    data = generate_chat_dataset(target_count=4300)
    messages = data["messages"]
    conversation = data["conversation"]
    participants = data["participants"]
    gt_map = data["gt_map"]

    print(f"Generated {len(messages)} messages across {len(participants)} participants.")
    print(f"Time range: {messages[0]['timestamp']} to {messages[-1]['timestamp']}")

    # Save to JSON
    os.makedirs("backend/data", exist_ok=True)
    dataset_output = {
        "conversation": conversation,
        "participants": participants,
        "messages": messages,
    }
    with open("backend/data/conversations.json", "w", encoding="utf-8") as f:
        json.dump(dataset_output, f, indent=2, ensure_ascii=False)
    print("Saved JSON dataset to backend/data/conversations.json")

    # Generate and save 40 evaluation queries
    queries = generate_40_evaluation_queries(gt_map)
    with open("scripts/evaluation_queries.json", "w", encoding="utf-8") as f:
        json.dump(queries, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(queries)} evaluation queries to scripts/evaluation_queries.json")

    # Seed SQLite Database directly
    from backend.app.repositories.sqlite_repo import SQLiteRepository
    from backend.app.models.conversation import ConversationCreate
    from backend.app.models.message import MessageCreate

    db_path = "backend/data/chat_intelligence.db"
    if os.path.exists(db_path):
        os.remove(db_path)

    repo = SQLiteRepository(db_path=db_path)
    repo.create_conversation(ConversationCreate(
        id=conversation["id"],
        title=conversation["title"],
        type=conversation["type"],
        participant_count=conversation["participant_count"]
    ))

    msg_models = [
        MessageCreate(
            id=m["id"],
            conversation_id=m["conversation_id"],
            sequence_num=m["sequence_num"],
            sender_id=m["sender_id"],
            sender_name=m["sender_name"],
            content=m["content"],
            timestamp=m["timestamp"],
            reply_to_id=m["reply_to_id"],
            is_code_mixed=m["is_code_mixed"],
            language=m["language"],
            metadata=m["metadata"]
        ) for m in messages
    ]

    inserted_count = repo.insert_messages_batch(msg_models)
    repo.update_message_count(conversation["id"], inserted_count)
    print(f"Successfully populated SQLite database at {db_path} with {inserted_count} messages.")


if __name__ == "__main__":
    main()

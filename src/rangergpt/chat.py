"""
RangerGPT - Terminal-based National Park Safety Assistant
Uses hybrid retrieval: SQL for structured data + Vector search for semantic alerts
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
import google.generativeai as genai
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "8000")
DB_NAME = os.getenv("DB_NAME", "nps_db")
DB_USER = os.getenv("DB_USER", "atlas_admin")
DB_PASSWORD = os.getenv("DB_PASSWORD", "atlas123")

# Initialize Gemini
genai.configure(api_key=GEMINI_API_KEY)

# System prompt for RangerGPT
RANGER_SYSTEM_PROMPT = """You are RangerGPT, an expert backcountry ranger and wilderness safety advisor for the US National Park System.

Your primary responsibility is visitor safety. You provide conservative, safety-first advice based on:
- Current weather conditions from weather_history table
- Active park alerts from the alerts table (retrieved via semantic search)
- General wilderness safety principles

IMPORTANT GUIDELINES:
1. Always err on the side of caution - if conditions are questionable, recommend postponing or choosing safer alternatives
2. When discussing specific trails or locations, acknowledge you only have park-wide data unless specific trail info is provided
3. If you don't have current data for a specific park, clearly state this and provide general advice
4. Never make assumptions about trail conditions - only use the provided context
5. Recommend checking with ranger stations for the most up-to-date trail-specific conditions
6. Be conversational but professional - you're a knowledgeable ranger, not a rigid bot

CONTEXT PROVIDED:
You will receive context in the following format:
- WEATHER DATA: Current conditions, temperature, wind, etc.
- ALERT DATA: Semantically relevant alerts based on the user's question
- PARK INFO: Basic park information

Use this context to provide specific, actionable safety advice.
"""

def get_db_connection():
    """Create database connection"""
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        cursor_factory=RealDictCursor
    )

def generate_embedding(text):
    """Generate embedding for text using Gemini"""
    try:
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="retrieval_query"  # Note: different task type for queries vs documents
        )
        return result['embedding']
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return None

def extract_park_code(user_query):
    """
    Simple park name extraction (can be enhanced with NER later)
    Returns park_code if found in query
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Get all parks
        cur.execute("SELECT park_code, full_name FROM dim_parks WHERE is_active = TRUE")
        parks = cur.fetchall()
        
        query_lower = user_query.lower()
        
        # Check for park name matches
        for park in parks:
            park_name = park['full_name'].lower()
            park_code = park['park_code']
            
            # Check for exact name or park code
            if park_name in query_lower or park_code.lower() in query_lower:
                return park_code
            
            # Check for common abbreviations
            name_parts = park_name.replace(' national park', '').split()
            if any(part in query_lower for part in name_parts if len(part) > 4):
                return park_code
        
        return None
    finally:
        cur.close()
        conn.close()

def get_weather_context(park_code):
    """Retrieve latest weather data for a park"""
    if not park_code:
        return None
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT 
                park_code,
                temperature,
                wind_speed,
                short_forecast,
                extracted_at
            FROM weather_history
            WHERE park_code = %s
            ORDER BY extracted_at DESC
            LIMIT 1
        """, (park_code,))
        
        return cur.fetchone()
    finally:
        cur.close()
        conn.close()

def get_relevant_alerts(query_text, park_code=None, limit=5):
    """
    Retrieve semantically relevant alerts using vector similarity
    Optionally filter by park_code
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Generate query embedding
        query_embedding = generate_embedding(query_text)
        if not query_embedding:
            return []
        
        # Build query with optional park filter
        if park_code:
            sql = """
                SELECT 
                    title,
                    description,
                    category,
                    park_code,
                    1 - (embedding <=> %s::vector) as similarity
                FROM alerts
                WHERE embedding IS NOT NULL
                  AND park_code = %s
                ORDER BY embedding <=> %s::vector
                LIMIT %s
            """
            params = (query_embedding, park_code, query_embedding, limit)
        else:
            sql = """
                SELECT 
                    title,
                    description,
                    category,
                    park_code,
                    1 - (embedding <=> %s::vector) as similarity
                FROM alerts
                WHERE embedding IS NOT NULL
                ORDER BY embedding <=> %s::vector
                LIMIT %s
            """
            params = (query_embedding, query_embedding, limit)
        
        cur.execute(sql, params)
        return cur.fetchall()
    
    finally:
        cur.close()
        conn.close()

def get_park_info(park_code):
    """Get basic park information"""
    if not park_code:
        return None
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT full_name, state, latitude, longitude
            FROM dim_parks
            WHERE park_code = %s
        """, (park_code,))
        return cur.fetchone()
    finally:
        cur.close()
        conn.close()

def build_context(user_query):
    """
    Build comprehensive context from database
    Returns formatted context string for LLM
    """
    # Extract park from query
    park_code = extract_park_code(user_query)
    
    context_parts = []
    
    # Get park info
    if park_code:
        park_info = get_park_info(park_code)
        if park_info:
            context_parts.append(f"PARK: {park_info['full_name']} ({park_code}), {park_info['state']}")
    
    # Get weather data
    weather = get_weather_context(park_code)
    if weather:
        context_parts.append(f"""
CURRENT WEATHER ({weather['park_code']}):
- Temperature: {weather['temperature']}°F
- Conditions: {weather['short_forecast']}
- Wind Speed: {weather['wind_speed']} mph
- Recorded: {weather['extracted_at']}
""")
    
    # Get relevant alerts via semantic search
    alerts = get_relevant_alerts(user_query, park_code, limit=3)
    if alerts:
        context_parts.append("\nRELEVANT ALERTS:")
        for i, alert in enumerate(alerts, 1):
            context_parts.append(f"""
Alert {i} [{alert['park_code']}] - Similarity: {alert['similarity']:.2f}
Title: {alert['title']}
Category: {alert['category']}
Description: {alert['description']}
""")
    
    if not context_parts:
        context_parts.append("No specific park data available. Providing general advice.")
    
    return "\n".join(context_parts)

def chat_with_ranger(user_query):
    """
    Main chat function - retrieves context and generates response
    """
    print("\n🔍 Retrieving relevant data...")
    
    # Build context from database
    context = build_context(user_query)
    
    # Prepare full prompt
    full_prompt = f"""{RANGER_SYSTEM_PROMPT}

CONTEXT:
{context}

USER QUESTION:
{user_query}

Provide a helpful, safety-focused response based on the context above.
"""
    
    # Generate response using Gemini
    try:
        model = genai.GenerativeModel('gemini-2.5-flash-lite')
        response = model.generate_content(full_prompt)
        
        return response.text
    except Exception as e:
        return f"Error generating response: {e}"

def main():
    """Interactive terminal chat loop"""
    print("=" * 70)
    print(" RANGERGPT - National Park Safety Assistant")
    print("=" * 70)
    print("\nAsk me about weather, trail conditions, or safety concerns!")
    print("Type 'quit' or 'exit' to end the conversation.\n")
    
    while True:
        user_input = input("You: ").strip()
        
        if user_input.lower() in ['quit', 'exit', 'q']:
            print("\n Stay safe out there! Happy trails!\n")
            break
        
        if not user_input:
            continue
        
        print("\n ..RangerGPT..: ", end="", flush=True)
        response = chat_with_ranger(user_input)
        print(response)
        print()

if __name__ == "__main__":
    main()

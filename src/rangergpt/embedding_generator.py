"""
Generate embeddings for NPS alerts using Google Gemini API
This script reads alerts from the database and generates embeddings
"""

import os
import psycopg2
from psycopg2.extras import execute_values
import google.generativeai as genai
from dotenv import load_dotenv
import time

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

def get_db_connection():
    """Create database connection using smart URL logic"""
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )

def create_embedding_text(alert):
    """
    Combine alert fields into a rich text for embedding
    This context helps the model understand the full semantic meaning
    """
    parts = []
    
    if alert.get('title'):
        parts.append(f"Alert: {alert['title']}")
    
    if alert.get('description'):
        parts.append(f"Description: {alert['description']}")
    
    if alert.get('category'):
        parts.append(f"Category: {alert['category']}")
    
    if alert.get('park_code'):
        parts.append(f"Park: {alert['park_code']}")
    
    return " | ".join(parts)

def generate_embedding(text, model="models/text-embedding-004"):
    """
    Generate embedding using Gemini API
    
    Args:
        text: Text to embed
        model: Gemini embedding model to use
        
    Returns:
        List of floats representing the embedding vector
    """
    try:
        result = genai.embed_content(
            model=model,
            content=text,
            task_type="retrieval_document"
        )
        return result['embedding']
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return None

def backfill_embeddings(batch_size=10):
    """
    Backfill embeddings for existing alerts that don't have them
    
    Args:
        batch_size: Number of alerts to process before committing
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Get alerts without embeddings
        cur.execute("""
            SELECT id, title, description, category, park_code
            FROM alerts
            WHERE embedding IS NULL
            ORDER BY updated_at DESC
        """)
        
        alerts = cur.fetchall()
        total = len(alerts)
        
        print(f"Found {total} alerts without embeddings")
        
        if total == 0:
            print("All alerts already have embeddings!")
            return
        
        processed = 0
        failed = 0
        
        for alert in alerts:
            alert_id, title, description, category, park_code = alert
            
            # Create embedding text
            alert_dict = {
                'title': title,
                'description': description,
                'category': category,
                'park_code': park_code
            }
            
            embedding_text = create_embedding_text(alert_dict)
            
            # Generate embedding
            print(f"Processing alert {processed + 1}/{total}: {title[:50]}...")
            embedding = generate_embedding(embedding_text)
            
            if embedding:
                # Update database
                cur.execute("""
                    UPDATE alerts
                    SET embedding = %s::vector,
                        embedding_generated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (embedding, alert_id))
                
                processed += 1
                
                # Commit in batches
                if processed % batch_size == 0:
                    conn.commit()
                    print(f"✓ Committed batch ({processed}/{total})")
                
                # Rate limiting (Gemini free tier: ~2 requests/second)
                time.sleep(0.5)
            else:
                failed += 1
                print(f"✗ Failed to generate embedding for alert {alert_id}")
        
        # Final commit
        conn.commit()
        
        print(f"\n=== Backfill Complete ===")
        print(f"Successfully processed: {processed}")
        print(f"Failed: {failed}")
        print(f"Total: {total}")
        
    except Exception as e:
        print(f"Error during backfill: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

def test_similarity_search(query_text, limit=5):
    """
    Test semantic search on alerts
    
    Args:
        query_text: Natural language query
        limit: Number of results to return
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Generate embedding for query
        print(f"Searching for: '{query_text}'")
        query_embedding = generate_embedding(query_text)
        
        if not query_embedding:
            print("Failed to generate query embedding")
            return
        
        # Semantic search using cosine similarity
        cur.execute("""
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
        """, (query_embedding, query_embedding, limit))
        
        results = cur.fetchall()
        
        print(f"\n=== Top {limit} Similar Alerts ===")
        for i, (title, description, category, park_code, similarity) in enumerate(results, 1):
            print(f"\n{i}. [{park_code}] {title}")
            print(f"   Category: {category}")
            print(f"   Similarity: {similarity:.3f}")
            print(f"   Description: {description[:100]}...")
        
    except Exception as e:
        print(f"Error during search: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "backfill":
            backfill_embeddings()
        elif sys.argv[1] == "search" and len(sys.argv) > 2:
            query = " ".join(sys.argv[2:])
            test_similarity_search(query)
        else:
            print("Usage:")
            print("  python embedding_generator.py backfill")
            print("  python embedding_generator.py search <query>")
    else:
        print("Usage:")
        print("  python embedding_generator.py backfill")
        print("  python embedding_generator.py search <query>")

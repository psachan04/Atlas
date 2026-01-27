-- Add embedding column to your alerts table
-- Gemini embedding models typically output 768-dimensional vectors
-- Using 768 dimensions for text-embedding-004 or similar

-- Check if your alerts table exists and add the column

ALTER TABLE alerts
ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Create an index for fast similarity search
-- Using Hierarchical Navigable Small World for efficient approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS alerts_embedding_idx
ON alerts
USING hnsw (embedding vector_cosine_ops);

-- Optional: Add a column to track when embedding was generated
ALTER TABLE alerts
ADD COLUMN IF NOT EXISTS embedding_generated_at TIMESTAMP;

-- Add index on park_code for faster joins with dim_parks
CREATE INDEX IF NOT EXISTS idx_alerts_park_code ON alerts(park_code);
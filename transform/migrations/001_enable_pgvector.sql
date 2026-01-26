-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Grant necessary permissions
GRANT ALL ON SCHEMA public TO atlas_admin;
"""
Run database migrations in order
"""
import os
import sys
import psycopg2
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def run_migrations():
    """Execute all SQL migrations in order"""

    # Database connection
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=os.getenv("DB_PORT", "8000"),
            database=os.getenv("DB_NAME", "nps_db"),
            user=os.getenv("DB_USER", "atlas_admin"),
            password=os.getenv("DB_PASSWORD", "atlas123")
        )
        print(f"✓ Connected to database at {os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '8000')}")
    except Exception as e:
        print(f"✗ Failed to connect to database: {e}")
        sys.exit(1)

    # Find migrations directory
    migrations_dir = Path(__file__).parent.parent / "transform" / "migrations"

    if not migrations_dir.exists():
        print(f"✗ Migrations directory not found: {migrations_dir}")
        sys.exit(1)

    migration_files = sorted(migrations_dir.glob("*.sql"))

    if not migration_files:
        print("No migration files found")
        return

    print(f"\nFound {len(migration_files)} migrations:")
    for mf in migration_files:
        print(f"  - {mf.name}")
    print()

    # Execute migrations
    for migration_file in migration_files:
        print(f"Running: {migration_file.name}...", end=" ", flush=True)

        try:
            with open(migration_file, 'r') as f:
                sql = f.read()

            with conn.cursor() as cur:
                cur.execute(sql)

            conn.commit()
            print("✓")
        except Exception as e:
            print(f"✗")
            print(f"Error in {migration_file.name}: {e}")
            conn.rollback()
            # Continue with other migrations

    conn.close()
    print("\n Migrations completed!")


if __name__ == "__main__":
    run_migrations()
#!/usr/bin/env bash
# RangerGPT Helper Script
# Usage: ./rangergpt.sh [command]

set -e

CONTAINER_NAME="nps_rangergpt"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function print_usage() {
    echo " RangerGPT Helper Script"
    echo ""
    echo "Usage: ./rangergpt.sh [command]"
    echo ""
    echo "Commands:"
    echo "  chat              - Start interactive chat with RangerGPT"
    echo "  backfill          - Generate embeddings for existing alerts"
    echo "  search <query>    - Test semantic search"
    echo "  migrate           - Run database migrations"
    echo "  shell             - Open bash shell in container"
    echo "  logs              - View container logs"
    echo "  restart           - Restart the RangerGPT container"
    echo ""
    echo "Examples:"
    echo "  ./rangergpt.sh chat"
    echo "  ./rangergpt.sh search 'steep trails winter'"
    echo "  ./rangergpt.sh migrate"
}

function check_container() {
    if ! docker ps | grep -q $CONTAINER_NAME; then
        echo -e "${YELLOW}️  RangerGPT container is not running!${NC}"
        echo "Starting it now..."
        docker-compose up -d rangergpt
        echo "Waiting for container to be ready..."
        sleep 3
    fi
}

case "${1:-}" in
    chat)
        echo -e "${GREEN} Starting RangerGPT chat...${NC}"
        check_container
        docker exec -it $CONTAINER_NAME python -m src.rangergpt.chat
        ;;
    
    backfill)
        echo -e "${BLUE} Generating embeddings for alerts...${NC}"
        check_container
        docker exec -it $CONTAINER_NAME python -m src.rangergpt.embedding_generator backfill
        ;;
    
    search)
        if [ -z "${2:-}" ]; then
            echo -e "${YELLOW}️  Please provide a search query${NC}"
            echo "Usage: ./rangergpt.sh search 'your query here'"
            exit 1
        fi
        echo -e "${BLUE} Searching for: '${2}'${NC}"
        check_container
        docker exec -it $CONTAINER_NAME python -m src.rangergpt.embedding_generator search "${@:2}"
        ;;
    
    migrate)
        echo -e "${BLUE} Running database migrations...${NC}"
        check_container
        docker exec -it $CONTAINER_NAME python scripts/run_migrations.py
        ;;
    
    shell)
        echo -e "${GREEN} Opening shell in RangerGPT container...${NC}"
        check_container
        docker exec -it $CONTAINER_NAME bash
        ;;
    
    logs)
        echo -e "${BLUE} RangerGPT logs:${NC}"
        docker logs -f $CONTAINER_NAME
        ;;
    
    restart)
        echo -e "${YELLOW} Restarting RangerGPT container...${NC}"
        docker-compose restart rangergpt
        echo -e "${GREEN} RangerGPT restarted!${NC}"
        ;;
    
    *)
        print_usage
        exit 1
        ;;
esac

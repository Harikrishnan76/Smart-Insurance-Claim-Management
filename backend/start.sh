#!/bin/bash
# ClaimSphere Backend Startup Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting ClaimSphere Backend..."
echo ""

cd "$SCRIPT_DIR"

# Check if dependencies are installed
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "📦 Installing dependencies..."
    pip3 install -r requirements.txt --break-system-packages -q
fi

# Run seed if DB doesn't exist
if [ ! -f "claimsphere.db" ]; then
    echo "🌱 Seeding database with demo data..."
    python3 seed.py
fi

echo ""
echo "✅ Starting FastAPI server on http://localhost:8000"
echo "📚 Swagger UI: http://localhost:8000/docs"
echo "📖 ReDoc:      http://localhost:8000/redoc"
echo ""

python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

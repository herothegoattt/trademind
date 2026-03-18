from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from pathlib import Path

from app.core.cors import add_cors
from app.api.router import router

app = FastAPI(title="TradeMind AI API")
add_cors(app)

# API routes
app.include_router(router)

# Serve frontend static files
frontend_build = Path(__file__).parent.parent.parent / "frontend" / ".next" / "static"
frontend_public = Path(__file__).parent.parent.parent / "frontend" / "public"

if frontend_build.exists():
    app.mount("/static", StaticFiles(directory=frontend_build), name="static")

if frontend_public.exists():
    app.mount("/public", StaticFiles(directory=frontend_public), name="public")

# Serve frontend index.html as fallback for SPA routes
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    """Serve frontend for all non-API routes"""
    # Don't intercept API routes
    if full_path.startswith("api/"):
        return {"error": "Not found"}
    
    frontend_dir = Path(__file__).parent.parent.parent / "frontend"
    
    # Try .next/server/app/page.html for production
    prod_file = frontend_dir / ".next" / "server" / "app" / f"{full_path}.html"
    if prod_file.exists():
        return FileResponse(prod_file)
    
    # Fallback to index.html for client-side routing
    index_file = frontend_dir / ".next" / "server" / "app" / "page.html"
    if index_file.exists():
        return FileResponse(index_file)
    
    # Development fallback
    index_file = frontend_dir / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    
    return {"error": "Frontend not built. Run 'npm run build' in frontend directory."}

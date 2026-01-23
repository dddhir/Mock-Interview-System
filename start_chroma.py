#!/usr/bin/env python3
import chromadb
from chromadb.config import Settings
import uvicorn
import sys

def start_chroma_server():
    try:
        print("🚀 Starting ChromaDB server on localhost:8000...")
        
        # Create ChromaDB client with persistent storage
        client = chromadb.PersistentClient(path="./chroma_db")
        
        # Start the server
        from chromadb.server.fastapi import FastAPI
        app = FastAPI(Settings(
            chroma_server_host="localhost",
            chroma_server_http_port=8000,
            persist_directory="./chroma_db"
        ))
        
        print("✅ ChromaDB server started successfully!")
        print("📍 Server running at: http://localhost:8000")
        print("💾 Data stored in: ./chroma_db")
        print("🛑 Press Ctrl+C to stop the server")
        
        uvicorn.run(app, host="localhost", port=8000)
        
    except Exception as e:
        print(f"❌ Error starting ChromaDB server: {e}")
        print("\n🔧 Troubleshooting:")
        print("1. Make sure ChromaDB is installed: pip install chromadb")
        print("2. Try updating: pip install --upgrade chromadb")
        print("3. Check if port 8000 is available")
        sys.exit(1)

if __name__ == "__main__":
    start_chroma_server()
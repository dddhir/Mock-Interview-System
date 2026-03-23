#!/usr/bin/env python3
"""
Startup script for AI Models Service
"""

import sys
import os
import subprocess
import logging

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def check_dependencies():
    """Check if required dependencies are installed"""
    try:
        import torch
        import transformers
        import fastapi
        import uvicorn
        print("✅ All required dependencies are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Please install dependencies with: pip install -r requirements.txt")
        return False

def main():
    """Main startup function"""
    print("🚀 Starting AI Models Service...")
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Set up logging
    logging.basicConfig(level=logging.INFO)
    
    try:
        # Import and run the FastAPI app
        import uvicorn
        
        print("🤖 Loading AI models...")
        print("📡 Starting server on http://localhost:8000")
        
        # Run the server
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=False,  # Disable reload in production
            log_level="info"
        )
        
    except KeyboardInterrupt:
        print("\n🛑 Shutting down AI Models Service...")
    except Exception as e:
        print(f"❌ Failed to start AI Models Service: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
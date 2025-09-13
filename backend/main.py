import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Create FastAPI app
app = FastAPI(title="SportBeacon AI API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://sportbeacon-ai.web.app"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "SportBeacon AI API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "SportBeacon AI API"}

@app.get("/api/test")
async def test_endpoint():
    return {"message": "API endpoint working correctly"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)

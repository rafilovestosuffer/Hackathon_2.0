import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import inspect

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(title="InspectAI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(inspect.router)

logger.info("InspectAI Backend initialized")


@app.get("/health")
def health():
    return {"status": "ok"}

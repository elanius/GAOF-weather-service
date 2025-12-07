from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.routers import zones

from app.background import Background


@asynccontextmanager
async def lifespan(app: FastAPI):
    # create a background asyncio task which will periodically process the zones
    async with Background():
        yield


# teardown


app = FastAPI(lifespan=lifespan)

app.include_router(zones.router)

origins = [
    "http://localhost:5173",  # React frontend running on this port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allow only specific origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
)

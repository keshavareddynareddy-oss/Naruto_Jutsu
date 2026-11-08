import os

import uvicorn

from app.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=os.getenv("APP_HOST", settings.APP_HOST),
        port=int(os.getenv("PORT", settings.APP_PORT)),
        reload=settings.ENV == "development",
    )

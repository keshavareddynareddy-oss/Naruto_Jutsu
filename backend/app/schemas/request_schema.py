from pydantic import BaseModel

class PredictionResponse(BaseModel):
    seal: str | None
    jutsu: str | None
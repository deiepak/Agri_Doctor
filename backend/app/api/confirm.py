from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.openai_service import generate_explanation

router = APIRouter()


class SymptomAnswer(BaseModel):
    symptom: str
    answer: bool


class ConfirmDiseaseRequest(BaseModel):
    disease_id: str
    plant_type: str
    image_observations: str | None = None
    symptom_answers: list[SymptomAnswer] = []
    language: str = "en"


class DiseasePrediction(BaseModel):
    disease: str
    diseaseId: str
    confidence: int


class ConfirmDiseaseResponse(BaseModel):
    explanation: str
    disease: DiseasePrediction


@router.post("/confirm-disease", response_model=ConfirmDiseaseResponse)
async def confirm_disease(request: ConfirmDiseaseRequest):
    """
    Generate an explanation for why this disease was identified.
    
    Uses OpenAI to create a human-readable explanation based on
    image observations and symptom answers.
    """
    
    # Format disease name from ID
    disease_name = request.disease_id.replace("_", " ").title()
    
    try:
        explanation = await generate_explanation(
            disease=disease_name,
            observations=request.image_observations or "",
            symptoms=[{"symptom": s.symptom, "answer": s.answer} for s in request.symptom_answers],
            language=request.language
        )
        
        return ConfirmDiseaseResponse(
            explanation=explanation,
            disease=DiseasePrediction(
                disease=disease_name,
                diseaseId=request.disease_id,
                confidence=85  # Default high confidence for confirmed disease
            )
        )
        
    except Exception as e:
        # Return default explanation on error
        return ConfirmDiseaseResponse(
            explanation=f"Based on the visual analysis and your symptom responses, the plant appears to be affected by {disease_name}.",
            disease=DiseasePrediction(
                disease=disease_name,
                diseaseId=request.disease_id,
                confidence=75
            )
        )

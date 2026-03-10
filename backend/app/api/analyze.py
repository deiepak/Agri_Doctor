from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.model_service import run_cascade, has_models_for_plant
from app.services.openai_service import analyze_image as openai_analyze
from app.core.config import get_settings

router = APIRouter()
settings = get_settings()


class AnalyzeImageRequest(BaseModel):
    image: str  # base64 encoded image
    plant_type: str  # tomato, potato, rice, wheat
    location: str | None = None


class DiseasePrediction(BaseModel):
    disease: str
    diseaseId: str
    confidence: int


class AnalyzeImageResponse(BaseModel):
    predictions: list[DiseasePrediction]
    notes: str
    tier: str  # "common", "uncommon", or "openai"


@router.post("/analyze-image", response_model=AnalyzeImageResponse)
async def analyze_plant_image(request: AnalyzeImageRequest):
    """
    Analyze a plant leaf image for diseases using a 3-tier cascade:

    1. **Tier 1 (Common Model)**: Fast local model for common diseases
    2. **Tier 2 (Uncommon Model)**: Extended local model for rare diseases
    3. **Tier 3 (OpenAI Vision)**: Cloud AI fallback for edge cases or unsupported plants

    - **image**: Base64 encoded image (JPEG or PNG)
    - **plant_type**: One of: tomato, potato, rice, wheat
    - **location**: Optional location/region for context
    """
    
    # Validate plant type
    valid_plants = ["tomato", "potato", "rice", "wheat"]
    if request.plant_type.lower() not in valid_plants:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid plant type. Must be one of: {', '.join(valid_plants)}"
        )
    
    plant_type = request.plant_type.lower()
    
    try:
        # ─── Try local models first (Tier 1 & 2) ────────────────────────
        if has_models_for_plant(plant_type):
            print(f"[ANALYZE] 🧠 Running local model cascade for {plant_type}...")
            
            cascade_result = run_cascade(
                image_base64=request.image,
                plant_type=plant_type,
                common_threshold=settings.common_confidence_threshold,
                uncommon_threshold=settings.uncommon_confidence_threshold,
            )
            
            # If local model returned a confident result
            if cascade_result["tier"] is not None:
                return AnalyzeImageResponse(
                    predictions=[
                        DiseasePrediction(
                            disease=p["disease"],
                            diseaseId=p["diseaseId"],
                            confidence=p["confidence"]
                        )
                        for p in cascade_result["predictions"]
                    ],
                    notes=cascade_result["notes"],
                    tier=cascade_result["tier"],
                )
            
            print(f"[ANALYZE] 🌐 Local models not confident. Falling through to OpenAI...")
        else:
            print(f"[ANALYZE] 📭 No local models for {plant_type}. Going directly to OpenAI...")
        
        # ─── Tier 3: OpenAI Vision API ───────────────────────────────────
        print(f"[ANALYZE] 🤖 Running OpenAI Vision analysis...")
        
        try:
            result = await openai_analyze(
                image_base64=request.image,
                plant_type=plant_type,
                location=request.location
            )
            
            return AnalyzeImageResponse(
                predictions=[
                    DiseasePrediction(
                        disease=p["disease"],
                        diseaseId=p.get("diseaseId", p["disease"].lower().replace(" ", "_")),
                        confidence=p["confidence"]
                    )
                    for p in result.get("predictions", [])
                ],
                notes=result.get("notes", ""),
                tier="openai",
            )
        except Exception as api_err:
            print(f"[ANALYZE] ⚠️ OpenAI failed ({api_err}). Trying local fallback...")
            # If we had local predictions (even low confidence), return those instead of crashing
            if cascade_result.get("predictions"):
                best_pred = cascade_result["predictions"][0]
                print(f"[ANALYZE] 🛡️ Using low-confidence local fallback: {best_pred['disease']}")
                return AnalyzeImageResponse(
                    predictions=[
                        DiseasePrediction(
                            disease=p["disease"],
                            diseaseId=p["diseaseId"],
                            confidence=p["confidence"]
                        )
                        for p in cascade_result["predictions"]
                    ],
                    notes=f"Cloud AI analysis failed. Falling back to local AI model's best guess.",
                    tier="local_fallback",
                )
            # If no local models existed at all, raise the error
            raise api_err
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )

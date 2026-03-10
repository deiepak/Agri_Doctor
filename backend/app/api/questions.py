import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

# Load disease data
DATA_PATH = Path(__file__).parent.parent / "data"


def load_diseases():
    with open(DATA_PATH / "diseases.json", "r", encoding="utf-8") as f:
        return json.load(f)


class SymptomAnswer(BaseModel):
    symptom: str
    answer: bool


class DiseasePrediction(BaseModel):
    disease: str
    diseaseId: str
    confidence: int


class AskQuestionRequest(BaseModel):
    plant_type: str
    disease_candidates: list[DiseasePrediction]
    symptom_answers: list[SymptomAnswer]


class AskQuestionResponse(BaseModel):
    nextQuestion: str | None
    confirmedDisease: DiseasePrediction | None
    remainingCandidates: list[DiseasePrediction]
    isComplete: bool


# Symptom questions in order
SYMPTOM_ORDER = [
    "yellow_spots",
    "leaf_curl",
    "white_powder",
    "edge_drying",
    "stem_rot",
    "wilting",
    "dark_spots",
    "stunted_growth",
]


@router.post("/ask-question", response_model=AskQuestionResponse)
async def ask_question(request: AskQuestionRequest):
    """
    Process symptom answers and determine next question or confirmed disease.
    
    Uses rule-based filtering to narrow down disease candidates.
    """
    
    diseases_db = load_diseases()
    plant_diseases = diseases_db.get(request.plant_type.lower(), [])
    
    if not plant_diseases:
        raise HTTPException(status_code=400, detail="Invalid plant type")
    
    # Get answered symptoms
    answered_symptoms = {sa.symptom: sa.answer for sa in request.symptom_answers}
    
    # Filter candidates based on symptom answers
    remaining_candidates = []
    
    for candidate in request.disease_candidates:
        # Find disease in database
        disease_data = next(
            (d for d in plant_diseases if d["id"] == candidate.diseaseId or 
             d["name"].lower() == candidate.disease.lower()),
            None
        )
        
        if not disease_data:
            # Keep candidate if not in database (let AI decision stand)
            remaining_candidates.append(candidate)
            continue
        
        # Check if disease matches answered symptoms
        disease_symptoms = disease_data.get("symptoms", {})
        matches = True
        match_score = 0
        
        for symptom, answer in answered_symptoms.items():
            expected = disease_symptoms.get(symptom)
            if expected is not None:
                if expected == answer:
                    match_score += 1
                elif expected != answer:
                    # Mismatch - reduce confidence but don't eliminate completely
                    match_score -= 0.5
        
        # Adjust confidence based on matches
        adjustment = match_score * 5  # Each match adds/subtracts 5%
        new_confidence = max(10, min(100, candidate.confidence + int(adjustment)))
        
        remaining_candidates.append(DiseasePrediction(
            disease=candidate.disease,
            diseaseId=candidate.diseaseId,
            confidence=new_confidence
        ))
    
    # Sort by confidence
    remaining_candidates.sort(key=lambda x: x.confidence, reverse=True)
    
    # Check if we have a clear winner (confidence gap > 20%)
    if len(remaining_candidates) >= 1:
        top = remaining_candidates[0]
        
        if top.confidence >= 85:
            return AskQuestionResponse(
                nextQuestion=None,
                confirmedDisease=top,
                remainingCandidates=remaining_candidates,
                isComplete=True
            )
        
        if len(remaining_candidates) >= 2:
            second = remaining_candidates[1]
            if top.confidence - second.confidence >= 25:
                return AskQuestionResponse(
                    nextQuestion=None,
                    confirmedDisease=top,
                    remainingCandidates=remaining_candidates,
                    isComplete=True
                )
    
    # Find next unanswered symptom
    next_symptom = None
    for symptom in SYMPTOM_ORDER:
        if symptom not in answered_symptoms:
            # Check if any remaining candidate has this symptom in their profile
            for disease in plant_diseases:
                if disease.get("symptoms", {}).get(symptom) is not None:
                    next_symptom = symptom
                    break
            if next_symptom:
                break
    
    # If we've asked enough questions, return best guess
    if next_symptom is None or len(answered_symptoms) >= 5:
        return AskQuestionResponse(
            nextQuestion=None,
            confirmedDisease=remaining_candidates[0] if remaining_candidates else None,
            remainingCandidates=remaining_candidates,
            isComplete=True
        )
    
    return AskQuestionResponse(
        nextQuestion=next_symptom,
        confirmedDisease=None,
        remainingCandidates=remaining_candidates,
        isComplete=False
    )

import json
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter()

# Load treatment data
DATA_PATH = Path(__file__).parent.parent / "data"


def load_treatments():
    with open(DATA_PATH / "treatments.json", "r", encoding="utf-8") as f:
        return json.load(f)


class Treatment(BaseModel):
    name: str
    dosage: str
    frequency: str
    warning: str


class TreatmentInfo(BaseModel):
    diseaseId: str
    diseaseName: str
    organic: list[Treatment]
    chemical: list[Treatment]
    prevention: list[Treatment]


@router.get("/treatment/{disease_id}", response_model=TreatmentInfo)
async def get_treatment(
    disease_id: str,
    lang: str = Query(default="en", description="Language code: en, hi, ne")
):
    """
    Get treatment information for a specific disease.
    
    Returns organic, chemical, and prevention options with dosages and warnings.
    
    **Note**: These are pre-defined treatments from the local database.
    The AI cannot invent new treatments.
    """
    
    treatments_db = load_treatments()
    
    # Normalize disease ID
    disease_id_normalized = disease_id.lower().replace(" ", "_")
    
    # Look for exact match first, then partial match
    treatment_data = treatments_db.get(disease_id_normalized)
    
    if not treatment_data:
        # Try partial match
        for key in treatments_db:
            if disease_id_normalized in key or key in disease_id_normalized:
                treatment_data = treatments_db[key]
                break
    
    if not treatment_data:
        # Return default/unknown treatment
        treatment_data = treatments_db.get("unknown", {
            "disease_name": disease_id.replace("_", " ").title(),
            "organic": [],
            "chemical": [],
            "prevention": [{
                "name": "Consult Local Expert",
                "dosage": "Contact your local agricultural extension office",
                "frequency": "As soon as possible",
                "warning": "Professional diagnosis is recommended for accurate treatment."
            }]
        })
    
    return TreatmentInfo(
        diseaseId=disease_id_normalized,
        diseaseName=treatment_data.get("disease_name", disease_id.replace("_", " ").title()),
        organic=[Treatment(**t) for t in treatment_data.get("organic", [])],
        chemical=[Treatment(**t) for t in treatment_data.get("chemical", [])],
        prevention=[Treatment(**t) for t in treatment_data.get("prevention", [])]
    )

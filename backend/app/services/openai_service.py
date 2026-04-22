import json
import base64
import random
from openai import OpenAI
from app.core.config import get_settings
import os

settings = get_settings()

# Check for mock mode (when OpenAI credits are exhausted)
MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() == "true"

# Initialize OpenAI client
client = OpenAI(api_key=settings.openai_api_key) if not MOCK_MODE else None

# Strict system prompt for disease analysis
DISEASE_ANALYSIS_PROMPT = """You are an agricultural plant disease diagnostic assistant.

You will receive:
- Plant type
- Leaf image
- Region (optional)

Tasks:
1. Identify up to 3 likely diseases for the given plant.
2. Provide confidence estimates (0–100).
3. Be conservative. If unsure, say "Uncertain".
4. Do NOT recommend treatment.
5. Do NOT hallucinate diseases not associated with the plant.

Return ONLY valid JSON in this format:
{
  "predictions": [
    {"disease": "Name", "confidence": 0}
  ],
  "notes": "short reasoning"
}"""

# Explanation prompt
EXPLANATION_PROMPT = """You are explaining to a farmer why we believe their plant has a specific disease.

Based on:
1. Image observations: {observations}
2. Symptom responses: {symptoms}
3. Identified disease: {disease}

Create a clear, simple explanation (2-3 sentences) in {language} that:
- Explains what visual signs led to this diagnosis
- References the symptoms the farmer confirmed
- Does NOT make any treatment recommendations
- Does NOT make medical or legal claims
- Uses simple language a farmer would understand"""

# Treatment rephrasing prompt
TREATMENT_REPHRASE_PROMPT = """You are helping translate and rephrase treatment information for farmers.

Treatment to rephrase:
{treatment}

Rephrase this in {language}, making it:
- Clear and simple for farmers to understand
- Include any safety warnings
- Add a standard disclaimer: "Consult a local agriculture officer before applying chemical treatments."

Do NOT invent new treatments or change dosages. Only rephrase what is given."""


from typing import Optional

async def analyze_image(
    image_base64: str,
    plant_type: str,
    location: Optional[str] = None
) -> dict:
    """Analyze a plant leaf image for diseases using GPT-4 Vision."""
    
    print(f"[DEBUG] Starting analysis for plant type: {plant_type}")
    print(f"[DEBUG] Image data length: {len(image_base64)} chars")
    print(f"[DEBUG] Mock mode: {MOCK_MODE}")
    
    # Mock mode for testing when OpenAI credits are exhausted
    if MOCK_MODE:
        print("[MOCK MODE] Returning mock disease predictions")
        mock_diseases = {
            "tomato": [
                {"disease": "Early Blight", "diseaseId": "early_blight", "confidence": 78},
                {"disease": "Late Blight", "diseaseId": "late_blight", "confidence": 45},
                {"disease": "Septoria Leaf Spot", "diseaseId": "septoria_leaf_spot", "confidence": 32},
            ],
            "potato": [
                {"disease": "Potato Late Blight", "diseaseId": "potato_late_blight", "confidence": 82},
                {"disease": "Potato Early Blight", "diseaseId": "potato_early_blight", "confidence": 41},
            ],
            "rice": [
                {"disease": "Rice Blast", "diseaseId": "rice_blast", "confidence": 75},
                {"disease": "Bacterial Leaf Blight", "diseaseId": "bacterial_leaf_blight", "confidence": 55},
            ],
            "wheat": [
                {"disease": "Wheat Rust", "diseaseId": "wheat_rust", "confidence": 80},
                {"disease": "Powdery Mildew", "diseaseId": "powdery_mildew_wheat", "confidence": 48},
            ],
        }
        
        diseases = mock_diseases.get(plant_type.lower(), mock_diseases["tomato"])
        # Randomize confidence slightly for more realistic behavior
        for d in diseases:
            d["confidence"] = min(100, max(0, d["confidence"] + random.randint(-10, 10)))
        
        return {
            "predictions": diseases,
            "notes": f"[MOCK MODE] Analysis simulated for {plant_type}. Enable real API by setting MOCK_MODE=false in .env"
        }
    
    # Prepare image for API
    # Remove data URL prefix if present
    if image_base64.startswith('data:'):
        image_base64 = image_base64.split(',')[1]
        print("[DEBUG] Removed data URL prefix")
    
    print(f"[DEBUG] Processed image length: {len(image_base64)} chars")
    
    # Construct the message
    user_content = f"Plant type: {plant_type}"
    if location:
        user_content += f"\nRegion: {location}"
    user_content += "\n\nPlease analyze the attached leaf image for diseases."
    
    try:
        print("[DEBUG] Calling OpenAI API...")
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {
                    "role": "system",
                    "content": DISEASE_ANALYSIS_PROMPT
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": user_content
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}",
                                "detail": "high"
                            }
                        }
                    ]
                }
            ],
            max_tokens=500,
            temperature=0.3,
        )
        
        print("[DEBUG] OpenAI API call successful")
        
        # Parse the response
        content = response.choices[0].message.content
        print(f"[DEBUG] Raw response: {content[:200]}...")
        
        # Clean up potential markdown code blocks
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        content = content.strip()
        
        result = json.loads(content)
        print(f"[DEBUG] Parsed result: {result}")
        
        # Add disease IDs
        for pred in result.get("predictions", []):
            pred["diseaseId"] = pred["disease"].lower().replace(" ", "_")
        
        return result
        
    except json.JSONDecodeError as e:
        print(f"[ERROR] JSON decode error: {e}")
        print(f"[ERROR] Content was: {content if 'content' in dir() else 'N/A'}")
        # If parsing fails, return a structured error response
        return {
            "predictions": [
                {"disease": "Unable to identify", "diseaseId": "unknown", "confidence": 0}
            ],
            "notes": "Could not parse AI response. Please try again with a clearer image."
        }
    except Exception as e:
        print(f"[ERROR] OpenAI API error: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise Exception(f"OpenAI API error: {str(e)}")


async def generate_explanation(
    disease: str,
    observations: str,
    symptoms: list[dict],
    language: str = "en"
) -> str:
    """Generate a human-readable explanation for the diagnosis."""
    
    # Format symptoms for the prompt
    symptom_text = ", ".join([
        f"{s['symptom'].replace('_', ' ')}: {'Yes' if s['answer'] else 'No'}"
        for s in symptoms
    ]) if symptoms else "No symptoms reported"
    
    # Language mapping
    lang_map = {
        "en": "English",
        "hi": "Hindi",
        "ne": "Nepali"
    }
    lang_name = lang_map.get(language, "English")
    
    prompt = EXPLANATION_PROMPT.format(
        observations=observations or "Visual analysis of the leaf image",
        symptoms=symptom_text,
        disease=disease,
        language=lang_name
    )
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Use smaller model for explanations
            messages=[
                {"role": "system", "content": "You are a helpful agricultural assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=200,
            temperature=0.5,
        )
        
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        # Return a default explanation on error
        return f"Based on the image analysis and your responses, the symptoms are consistent with {disease}."


async def rephrase_treatment(
    treatment: dict,
    language: str = "en"
) -> dict:
    """Rephrase treatment information in the target language."""
    
    if language == "en":
        return treatment  # No rephrasing needed for English
    
    # Language mapping
    lang_map = {
        "hi": "Hindi",
        "ne": "Nepali"
    }
    lang_name = lang_map.get(language, "English")
    
    treatment_text = f"""
Name: {treatment['name']}
Dosage: {treatment['dosage']}
Frequency: {treatment['frequency']}
Warning: {treatment.get('warning', 'Follow safety precautions')}
"""
    
    prompt = TREATMENT_REPHRASE_PROMPT.format(
        treatment=treatment_text,
        language=lang_name
    )
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,
            temperature=0.3,
        )
        
        # Parse the rephrased content (simplified)
        content = response.choices[0].message.content.strip()
        
        # Return with translated values (keeping structure)
        return {
            "name": treatment['name'],  # Keep original name
            "dosage": treatment['dosage'],
            "frequency": treatment['frequency'],
            "warning": treatment.get('warning', ''),
            "translated_description": content
        }
        
    except Exception:
        return treatment  # Return original on error

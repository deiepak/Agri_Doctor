# 🌱 Plant Disease Identifier

AI-powered plant disease identification for farmers. Upload a leaf image, answer symptom questions, and get treatment recommendations.

![Plant Disease Identifier](https://img.shields.io/badge/AI--Powered-Plant%20Disease%20Detection-green)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.15+-orange)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4%20Vision-412991)

## ✨ Features

- 📱 **Mobile-First Design** - Optimized for low-end Android phones
- 📸 **Camera Integration** - Capture leaf images directly on mobile
- 🖼️ **Image Cropping** - Focus on the affected leaf area
- 🧠 **3-Tier AI Cascade** - Blazing fast Local CNN models (MobileNetV2) with OpenAI Vision API fallback for edge cases
- 🌍 **Multi-Language** - Hindi, Nepali, and English support
- ❓ **Smart Questions** - Akinator-style symptom confirmation
- 💊 **Treatment Guide** - Organic, chemical, and prevention options
- ⚠️ **Safety First** - Clear disclaimers and dosage warnings

## 🏗️ Architecture

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│                 │       │                 │       │  OpenAI API     │
│   Next.js App   │──────▶│  FastAPI Server │──────▶│  (Fallback)     │
│   (Frontend)    │       │   (Backend)     │       └─────────────────┘
│                 │       │                 │                ▲
└─────────────────┘       └─────────────────┘                │
                                 │                           │
                   ┌─────────────┴──────────────┐   (If low confidence)
                   ▼                            ▼            │
         ┌─────────────────┐           ┌─────────────────┐   │
         │  Tier 1 Local   │──(Low %)─▶│  Tier 2 Local   │───┘
         │  Model (Common) │           │ Model (Uncommon)│
         └─────────────────┘           └─────────────────┘
                   │                            │
                   ▼                            ▼
         ┌───────────────────────────────────────────────┐
         │          Disease & Treatment DB               │
         └───────────────────────────────────────────────┘
```

## 📁 Project Structure

```
/
├── frontend/                 # Next.js 14 application
│   ├── src/
│   │   ├── app/             # Pages and layouts
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── i18n/            # Translation files
│   │   └── lib/             # Utilities & API
│   └── package.json
│
├── backend/                  # FastAPI server
│   ├── app/
│   │   ├── api/             # API endpoints
│   │   ├── core/            # Configuration
│   │   ├── data/            # Disease & treatment JSON
│   │   ├── models/          # Saved .h5 CNN models & config
│   │   └── services/        # ML inference & OpenAI integration
│   ├── main.py              # FastAPI server entry point
│   ├── train_models.py      # M4-optimized Local ML Training script
│   └── requirements.txt
│
└── archive/                  # Disease Image Dataset (for training)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- OpenAI API key with GPT-4 Vision access (for Tier 3 fallback)

### 1. Clone and Setup

```bash
cd "e:\sem mini project"
```

### 2. Backend Setup & Model Training

```bash
# Navigate to backend
cd backend

# Create & activate virtual environment
python -m venv venv_gpu
source venv_gpu/bin/activate  # (Mac/Linux) or .\venv_gpu\Scripts\activate (Windows)

# Install dependencies (including tensorflow)
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Train the local models (This takes the images in /archive and trains 3 highly compressed CNN models natively for 200 epochs)
python train_models.py
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

### 4. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
source venv_gpu/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Open the App

- Frontend: http://localhost:3000
- Backend API Docs: http://localhost:8000/docs

## 🧠 3-Tier AI Cascade Details

In order to optimize local processing speeds while retaining high accuracy, the app uses a cascading strategy:

1. **Tier 1 (Common Models):** Runs a lightweight MobileNetV2 `.h5` model against the most common diseases for a specific plant (Threshold: 80%).
2. **Tier 2 (Uncommon Models):** If the image is highly contested, it passes through an expanded local model containing the less common diseases (Threshold: 70%).
3. **Tier 3 (OpenAI Vision Fallback):** If local models fail or the plant type is not inherently trained locally (e.g. Rice/Wheat), the base64 image gracefully cascades to GPT-4o Vision to infer the disease contextually.

## 🌾 Supported Plants & Diseases

### Tomato 🍅
- Early Blight (Common)
- Late Blight (Common)
- Septoria Leaf Spot (Common)
- Tomato Yellow Leaf Curl Virus (Common)
- Leaf Mold 
- Target Spot
- Bacterial Spot
- Mosaic Virus
- Spider Mites

### Potato 🥔
- Late Blight 
- Early Blight 
- Blackleg 
- Common Scab

### Rice & Wheat 🌾
- *Full fall-through natively to OpenAI Tier 3 Model* 

## 🛡️ Safety & Disclaimers

This application includes important safety measures:

- **AI Disclaimer**: "AI-assisted guidance only. Consult a local agriculture officer before using any chemical treatments."
- **Treatment Warnings**: All chemical treatments include safety warnings, dosages, and pre-harvest intervals
- **No AI-Invented Treatments**: The AI can only rephrase and translate pre-defined treatments from the structured JSON database
- **Internet Required**: The app clearly indicates when internet connectivity is needed for Tier 3 fallbacks.

## 📝 Environment Variables

### Backend (.env)
```env
OPENAI_API_KEY=sk-...               # Required for Tier 3 Fallback
OPENAI_MODEL=gpt-4o                 # Optional (default: gpt-4o)
RATE_LIMIT_PER_MINUTE=30            # Optional
MOCK_MODE=false                     # Optional (skips OpenAI call to save credits during testing)
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```


# DataPilot AI — Multi-User Analytics Platform

DataPilot AI is a production-grade, zero-code CSV analytics platform. Users can upload datasets, ask questions in natural language, and receive AI-generated summaries and visualizations using Pandas, FastMCP, and Llama-3.

## Features
- **Multi-User Authentication:** Secure JWT-based login and registration.
- **Data Isolation:** Complete separation of datasets, chat history, and insights per user.
- **Natural Language Analytics:** Ask questions like "Show me a bar chart of Sales by Region".
- **Insight Gallery:** Save important generated charts for later viewing.

## Architecture
- **Frontend:** React + Vite + Tailwind CSS + Lucide Icons
- **Backend:** FastAPI (Async)
- **Database:** MongoDB (Motor async driver)
- **AI / Agent:** Groq (Llama-3 70b) + FastMCP
- **Analytics:** Pandas + Seaborn

## Setup Instructions

### 1. MongoDB Setup
Ensure you have MongoDB running locally on `mongodb://localhost:27017` or update the `.env` file with your URI.

### 2. Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory:
```
GROQ_API_KEY=your_api_key_here
JWT_SECRET_KEY=super_secret_key_change_me
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE_NAME=datapilot
CORS_ORIGINS=["*"]
```

Run the backend:
```bash
uvicorn main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173`.

import io
import json
import base64
import os
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from typing import List
from groq import Groq

from app.database.mongodb import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.analysis import AnalysisSession, AnalysisMessage
from app.schemas.analysis import AnalysisSessionCreate, AnalysisSessionResponse, AnalysisMessageResponse, ChatRequest

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

def execute_plot(df: pd.DataFrame, column_str: str, plot_type: str = "bar"):
    if df is None or df.empty: return None
    
    plt.figure(figsize=(10, 6))
    sns.set_theme(style="darkgrid")
    
    if " vs " in column_str.lower() or " and " in column_str.lower():
        separator = " vs " if " vs " in column_str.lower() else " and "
        parts = column_str.lower().split(separator)
        x_col = next((c for c in df.columns if c.lower() == parts[0].strip()), None)
        y_col = next((c for c in df.columns if c.lower() == parts[1].strip()), None)
        
        if x_col and y_col:
            try:
                if pd.api.types.is_numeric_dtype(df[y_col]):
                    if plot_type == 'scatter':
                        if pd.api.types.is_numeric_dtype(df[x_col]):
                            sns.scatterplot(data=df, x=x_col, y=y_col, color='#6366f1')
                        else:
                            sns.stripplot(data=df, x=x_col, y=y_col, color='#6366f1')
                        plt.title(f"{y_col} vs {x_col}", color='white', fontsize=14)
                    else:
                        grouped = df.groupby(x_col)[y_col].sum()
                        
                        if plot_type == 'pie':
                            grouped = grouped.sort_values(ascending=False).head(15)
                            grouped.plot(kind='pie', autopct='%1.1f%%', textprops={'color':"w"})
                            plt.ylabel('')
                        elif plot_type == 'line':
                            grouped = grouped.sort_index().head(30)
                            grouped.plot(kind='line', marker='o', color='#6366f1')
                        else:
                            grouped = grouped.sort_values(ascending=False).head(15)
                            grouped.plot(kind='bar', color='#6366f1')
                            
                        plt.title(f"Total {y_col} by {x_col}", color='white', fontsize=14)
                else:
                    return None
            except Exception:
                return None
        else:
            return None
    else:
        col = next((c for c in df.columns if c.lower() == column_str.lower().strip()), None)
        if not col: return None
        
        if pd.api.types.is_numeric_dtype(df[col]):
            sns.histplot(df[col], kde=True, color='#6366f1')
            plt.title(f"Distribution of {col}", color='white', fontsize=14)
        else:
            grouped = df[col].value_counts().head(10)
            if plot_type == 'pie':
                grouped.plot(kind='pie', autopct='%1.1f%%', textprops={'color':"w"})
                plt.ylabel('')
            elif plot_type == 'line':
                grouped.plot(kind='line', marker='o', color='#6366f1')
            else:
                grouped.plot(kind='bar', color='#6366f1')
            plt.title(f"Top 10 {col}", color='white', fontsize=14)
            
    plt.xticks(rotation=45)
    plt.tight_layout()
    
    fig = plt.gcf()
    fig.patch.set_facecolor('#1e293b')
    ax = plt.gca()
    ax.set_facecolor('#0f172a')
    ax.tick_params(colors='white')
    ax.xaxis.label.set_color('white')
    ax.yaxis.label.set_color('white')

    buf = io.BytesIO()
    plt.savefig(buf, format='png', facecolor=fig.get_facecolor())
    plt.close()
    buf.seek(0)
    return base64.b64encode(buf.read()).decode('utf-8')

async def build_groq_tools():
    return [
        {
            "type": "function",
            "function": {
                "name": "get_summary",
                "description": "Generate a full statistical summary of the dataset.",
                "parameters": {"type": "object", "properties": {}}
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_plot",
                "description": "Generate a plot.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "column_str": {"type": "string", "description": "The column(s) like 'Category' or 'Category vs Sales'"},
                        "plot_type": {"type": "string", "enum": ["bar", "pie", "line", "scatter"]}
                    },
                    "required": ["column_str"]
                }
            }
        }
    ]

@router.post("/sessions", response_model=AnalysisSessionResponse)
async def create_session(
    data: AnalysisSessionCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    # Verify dataset exists
    dataset = await db.datasets.find_one({"_id": ObjectId(data.dataset_id), "user_id": current_user["id"]})
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    session = AnalysisSession(
        user_id=current_user["id"],
        dataset_id=data.dataset_id,
        title=data.title
    )
    
    session_dict = session.model_dump(by_alias=True, exclude={"id"})
    result = await db.analysis_sessions.insert_one(session_dict)
    
    created_session = await db.analysis_sessions.find_one({"_id": result.inserted_id})
    created_session["id"] = str(created_session["_id"])
    return created_session

@router.get("/sessions", response_model=List[AnalysisSessionResponse])
async def list_sessions(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    sessions = await db.analysis_sessions.find({"user_id": current_user["id"]}).sort("created_at", -1).to_list(100)
    for s in sessions:
        s["id"] = str(s["_id"])
    return sessions

@router.get("/sessions/{session_id}/messages", response_model=List[AnalysisMessageResponse])
async def get_messages(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    session = await db.analysis_sessions.find_one({"_id": ObjectId(session_id), "user_id": current_user["id"]})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    messages = await db.analysis_messages.find({"session_id": session_id}).sort("created_at", 1).to_list(100)
    for m in messages:
        m["id"] = str(m["_id"])
    return messages

@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    session = await db.analysis_sessions.find_one({"_id": ObjectId(session_id), "user_id": current_user["id"]})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    await db.analysis_sessions.delete_one({"_id": ObjectId(session_id)})
    await db.analysis_messages.delete_many({"session_id": session_id})
    
    return {"status": "success"}

@router.post("/chat")
async def chat(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    dataset = await db.datasets.find_one({"_id": ObjectId(request.dataset_id), "user_id": current_user["id"]})
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    if not os.path.exists(dataset["storage_key"]):
        raise HTTPException(status_code=500, detail="Dataset file missing from storage")
        
    client = Groq(api_key=settings.GROQ_API_KEY) if settings.GROQ_API_KEY else None
    if not client:
        raise HTTPException(status_code=500, detail="Groq API Key not set.")

    session_id = request.session_id
    if not session_id:
        # Create a new session
        session = AnalysisSession(
            user_id=current_user["id"],
            dataset_id=request.dataset_id,
            title=request.query[:30] + "..."
        )
        session_dict = session.model_dump(by_alias=True, exclude={"id"})
        result = await db.analysis_sessions.insert_one(session_dict)
        session_id = str(result.inserted_id)
    else:
        # Verify session ownership
        session = await db.analysis_sessions.find_one({"_id": ObjectId(session_id), "user_id": current_user["id"]})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
            
    # Save user message
    user_msg = AnalysisMessage(
        session_id=session_id,
        user_id=current_user["id"],
        dataset_id=request.dataset_id,
        role="user",
        content=request.query
    )
    await db.analysis_messages.insert_one(user_msg.model_dump(by_alias=True, exclude={"id"}))

    # Read dataset
    df = pd.read_csv(dataset["storage_key"])
    data_sample = df.head(50).to_csv(index=False)
    groq_tools = await build_groq_tools()

    prompt = f"""
    You are DataPilot AI, a business analytics assistant.
    The user has uploaded a CSV named {dataset['filename']}.
    Here is a data sample:
    {data_sample}
    
    Instructions:
    1. If the user asks for a general statistical summary, call the 'get_summary' tool.
    2. If the user asks for a graph or plot, call the 'get_plot' tool.
    3. For all other questions, analyze the data sample and answer directly. DO NOT call tools for simple math or filtering questions.
    CRITICAL: When calling tools, you must output standard JSON tool calls. Do not use raw XML tags.
    """
    
    try:
        # For a full history context, we could fetch past messages here.
        # Keeping it simple and adhering to the existing logic format for now.
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": request.query}
            ],
            model="openai/gpt-oss-120b",
            temperature=0.2,
            tools=groq_tools,
            tool_choice="auto"
        )
        
        message = response.choices[0].message
        
        reply_content = ""
        result_data = None
        visualization = None
        
        if message.tool_calls:
            tool_call = message.tool_calls[0]
            tool_name = tool_call.function.name
            args = json.loads(tool_call.function.arguments)
            
            if tool_name == "get_summary":
                reply_content = "Here is a statistical summary of your dataset:"
                result_data = json.loads(df.describe(include='all').to_json())
            
            elif tool_name == "get_plot":
                col_str = args.get("column_str", "")
                plot_t = args.get("plot_type", "bar")
                img = execute_plot(df, col_str, plot_t)
                if img:
                    reply_content = f"I've generated the {plot_t} chart for: {col_str}"
                    visualization = img
                else:
                    reply_content = f"I couldn't generate a plot for '{col_str}'. Please check the column names."
        else:
            reply_content = message.content.strip()
            
        # Save AI message
        ai_msg = AnalysisMessage(
            session_id=session_id,
            user_id=current_user["id"],
            dataset_id=request.dataset_id,
            role="assistant",
            content=reply_content,
            result=result_data,
            visualization=visualization
        )
        await db.analysis_messages.insert_one(ai_msg.model_dump(by_alias=True, exclude={"id"}))
        
        return {
            "session_id": session_id,
            "response": reply_content,
            "data": result_data,
            "image": visualization
        }

    except Exception as e:
        error_msg = str(e)
        reply = f"AI Engine Error: {error_msg}"
        if "429" in error_msg or "RateLimit" in error_msg:
            reply = "Groq API rate limit exceeded. Please wait a moment and try again."
        elif "tool_use_failed" in error_msg or "failed_generation" in error_msg:
            reply = "The AI attempted to generate a chart but formatted the request incorrectly. Please rephrase your request."
            
        # Save error msg as AI response
        ai_msg = AnalysisMessage(
            session_id=session_id,
            user_id=current_user["id"],
            dataset_id=request.dataset_id,
            role="assistant",
            content=reply
        )
        await db.analysis_messages.insert_one(ai_msg.model_dump(by_alias=True, exclude={"id"}))
        return {"session_id": session_id, "response": reply}

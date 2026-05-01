import os
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional
import json
import io
import base64
from groq import Groq
from dotenv import load_dotenv
from fastmcp import FastMCP

load_dotenv()

# Configure Groq
api_key = os.getenv("GROQ_API_KEY")
if api_key:
    client = Groq(api_key=api_key)
else:
    client = None

app = FastAPI(title="DataPilot AI: Smart CSV Analyzer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared State
class State:
    df: Optional[pd.DataFrame] = None
    filename: Optional[str] = None

state = State()

# --- FastMCP Tool Registry ---
mcp = FastMCP("DataPilot")

@mcp.tool()
def get_summary() -> str:
    """Generate a full statistical summary of the dataset."""
    pass

@mcp.tool()
def get_plot(column_str: str, plot_type: str = "bar") -> str:
    """Generate a plot. column_str is the column(s) like 'Category' or 'Category vs Sales'. plot_type can be 'bar', 'pie', 'line', or 'scatter'."""
    pass

async def build_groq_tools():
    """Return hardcoded JSON schemas for Groq to prevent tool_use_failed errors."""
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

# --- Internal Tools Execution ---

def execute_plot(column_str: str, plot_type: str = "bar"):
    if state.df is None: return None
    
    plt.figure(figsize=(10, 6))
    sns.set_theme(style="darkgrid")
    
    if " vs " in column_str.lower() or " and " in column_str.lower():
        separator = " vs " if " vs " in column_str.lower() else " and "
        parts = column_str.lower().split(separator)
        x_col = next((c for c in state.df.columns if c.lower() == parts[0].strip()), None)
        y_col = next((c for c in state.df.columns if c.lower() == parts[1].strip()), None)
        
        if x_col and y_col:
            try:
                if pd.api.types.is_numeric_dtype(state.df[y_col]):
                    if plot_type == 'scatter':
                        if pd.api.types.is_numeric_dtype(state.df[x_col]):
                            sns.scatterplot(data=state.df, x=x_col, y=y_col, color='#6366f1')
                        else:
                            sns.stripplot(data=state.df, x=x_col, y=y_col, color='#6366f1')
                        plt.title(f"{y_col} vs {x_col}", color='white', fontsize=14)
                    else:
                        grouped = state.df.groupby(x_col)[y_col].sum()
                        
                        if plot_type == 'pie':
                            grouped = grouped.sort_values(ascending=False).head(15)
                            grouped.plot(kind='pie', autopct='%1.1f%%', textprops={'color':"w"})
                            plt.ylabel('')
                        elif plot_type == 'line':
                            # For line charts (Time Series), sort chronologically by the X-axis instead of highest-value
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
        col = next((c for c in state.df.columns if c.lower() == column_str.lower().strip()), None)
        if not col: return None
        
        if pd.api.types.is_numeric_dtype(state.df[col]):
            sns.histplot(state.df[col], kde=True, color='#6366f1')
            plt.title(f"Distribution of {col}", color='white', fontsize=14)
        else:
            grouped = state.df[col].value_counts().head(10)
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

# --- Endpoints ---

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        state.df = pd.read_csv(io.BytesIO(contents))
        state.filename = file.filename
        return {
            "status": "success",
            "filename": file.filename,
            "columns": list(state.df.columns),
            "rows": len(state.df)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/chat")
async def chat(query: str = Form(...)):
    if state.df is None:
        return {"response": "Please upload a CSV file first."}

    if not client:
        return {"response": "Groq API Key not set."}

    data_sample = state.df.head(50).to_csv(index=False)
    groq_tools = await build_groq_tools()

    prompt = f"""
    You are DataPilot AI, a business analytics assistant.
    The user has uploaded a CSV named {state.filename}.
    Here is a data sample:
    {data_sample}
    
    Instructions:
    1. If the user asks for a general statistical summary, call the 'get_summary' tool.
    2. If the user asks for a graph or plot, call the 'get_plot' tool.
    3. For all other questions, analyze the data sample and answer directly. DO NOT call tools for simple math or filtering questions.
    CRITICAL: When calling tools, you must output standard JSON tool calls. Do not use raw XML tags.
    """
    
    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": query}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.2,
            tools=groq_tools,
            tool_choice="auto"
        )
        
        message = response.choices[0].message
        
        # Native FastMCP Tool Orchestration Execution
        if message.tool_calls:
            tool_call = message.tool_calls[0]
            tool_name = tool_call.function.name
            args = json.loads(tool_call.function.arguments)
            
            if tool_name == "get_summary":
                return {"response": "Here is a statistical summary of your dataset:", "data": json.loads(state.df.describe(include='all').to_json())}
            
            elif tool_name == "get_plot":
                col_str = args.get("column_str", "")
                plot_t = args.get("plot_type", "bar")
                img = execute_plot(col_str, plot_t)
                if img:
                    return {"response": f"I've generated the {plot_t} chart for: {col_str}", "image": img}
                else:
                    return {"response": f"I couldn't generate a plot for '{col_str}'. Please check the column names."}

        return {"response": message.content.strip()}

    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "RateLimit" in error_msg:
            return {"response": "Groq API rate limit exceeded. Please wait a moment and try again."}
        if "tool_use_failed" in error_msg or "failed_generation" in error_msg:
            return {"response": "The AI attempted to generate a chart but formatted the request incorrectly. Please rephrase your request (e.g., 'Generate a bar chart for Product vs Quantity')."}
        return {"response": f"AI Engine Error: {error_msg}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

# DataPilot AI: System Architecture & Workflow

This document outlines the architecture and step-by-step workflow of the DataPilot AI application. The system operates on a modern **LLM Orchestration** pattern, where the LLM acts as an intelligent router rather than just a text generator.

## High-Level Architecture Diagram

```mermaid
graph TD
    subgraph Frontend [Frontend: React + Tailwind v4]
        UI[User Interface]
        State[Browser Memory / Context]
    end

    subgraph Backend [Backend: Python + FastAPI + FastMCP]
        API_Up[/Upload Endpoint /upload/]
        API_Chat[/Chat Endpoint /chat/]
        
        subgraph Tools [Data & Analysis Engine]
            Pandas[(Pandas DataFrame)]
            Plot[Matplotlib / Seaborn]
        end
        
        FastMCP_Registry[[FastMCP Tool Registry]]
    end

    subgraph Cloud [External LLM Provider]
        Groq((Groq API: Llama 3.3))
    end

    %% Upload Flow
    UI -- "1. Drag & Drop CSV" --> API_Up
    API_Up -- "2. Load & Parse" --> Pandas
    Pandas -. "3. Return Schema" .-> UI

    %% Chat Flow
    UI -- "4. Natural Language Query" --> API_Chat
    API_Chat -- "5. Extract 50-row Sample" --> Pandas
    FastMCP_Registry -- "6. Export Tool JSON Schemas" --> API_Chat
    Pandas -- "7. Inject Data Sample + Query" --> API_Chat
    
    API_Chat -- "8. Send Query + Tool Schemas" --> Groq
    Groq -- "9. Return Native Tool Call (JSON)" --> API_Chat

    %% Orchestration Logic inside Backend
    API_Chat -- "If get_plot()" --> Plot
    Plot -- "Generate Base64 Graph" --> API_Chat
    
    API_Chat -- "If get_summary()" --> Pandas
    Pandas -- "Compute describe()" --> API_Chat

    %% Final Return
    API_Chat -. "9. Return JSON (Text + Images + Data)" .-> UI
    UI -- "10. Render Beautiful Components" --> State

    classDef react fill:#0ea5e9,stroke:#0284c7,stroke-width:2px,color:#fff;
    classDef fast fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff;
    classDef data fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff;
    classDef ai fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#fff;

    class UI,State react;
    class API_Up,API_Chat fast;
    class Pandas,Plot data;
    class Groq ai;
```

---

## Detailed Step-by-Step Workflow

### Phase 1: Data Ingestion
1. **User Action**: The user drops a CSV file into the React frontend.
2. **Transmission**: The file is sent via `multipart/form-data` to the FastAPI `/upload` endpoint.
3. **Memory Storage**: Pandas reads the file bytes directly into a global backend memory object (`state.df`).
4. **Schema Extraction**: The backend extracts the column names and total row count, returning them to the React app to populate the sidebar.

### Phase 2: LLM Orchestration & FastMCP
1. **User Query**: The user asks a question (e.g., *"Plot category vs quantity"* or *"What is the top product?"*).
2. **Context Injection**: The FastAPI backend captures the query. It slices the first 50 rows of the Pandas DataFrame and converts it to a CSV string.
3. **Tool Schema Export**: The backend queries the `FastMCP` registry to dynamically export the JSON schemas for the `@mcp.tool()` decorated functions (`get_summary` and `get_plot`).
4. **LLM Evaluation**: The Groq API receives the prompt and the FastMCP tool schemas. It decides whether to calculate an answer natively or execute a "Native Tool Call" by returning a strict JSON object specifying which function to run and its arguments.

### Phase 3: Backend Execution
1. **Routing**: The FastAPI endpoint reads the LLM's response. If a `tool_calls` array is present, it intercepts it.
2. **Tool Execution**:
   * If the LLM called `get_plot`, the backend extracts the arguments (e.g., `{"column_str": "Category vs Sales"}`) and uses Pandas/Seaborn to draw a Matplotlib chart, exporting it as Base64.
   * If the LLM called `get_summary`, Pandas runs a full statistical `.describe()` computation and converts it to JSON.

### Phase 4: Frontend Rendering
1. **Payload Assembly**: The backend returns a single JSON object containing `response` (text), `image` (Base64 string), and `data` (JSON table).
2. **Dynamic UI**: React catches the response. If an image string exists, it mounts a Framer Motion component to smoothly animate the graph onto the screen. If tabular data exists, it renders a custom HTML table.

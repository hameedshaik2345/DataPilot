# DataPilot AI: Smart CSV Intelligence
## Presentation Content Guide

*Use the following structured content to easily copy and paste into your PowerPoint slides.*

---

### Slide 1: Title Slide
* **Title:** DataPilot AI
* **Subtitle:** Smart CSV Intelligence through LLM Orchestration
* **Presented by:** [Your Name]
* **Course/Professor:** [Professor's Name]

---

### Slide 2: The Problem Statement
* **Information Overload:** Business analysts frequently work with massive CSV datasets containing complex sales and customer data.
* **Time Bottleneck:** Manually filtering data, calculating statistics, and writing Python/Excel code to generate visualizations is incredibly time-consuming.
* **The AI Limitation:** Traditional LLMs (like ChatGPT) can generate text, but they cannot *securely execute code* on local, private datasets without hallucinating or requiring data to be uploaded to a public cloud.
* **The Goal:** Build an autonomous, agentic assistant that securely processes local data and dynamically orchestrates specialized analytical tools to answer user queries instantly.

---

### Slide 3: The Solution
* **DataPilot AI** is an intelligent, MCP-based (Model Context Protocol) business analytics assistant.
* **Autonomous Tool Calling:** Instead of just generating text, the AI acts as an orchestrator. When a user asks a question, DataPilot *decides* which statistical tool to use, executes it, and returns the result.
* **Natural Language to Visualizations:** Users can type "Plot Category vs Sales" and instantly receive beautifully rendered, mathematically accurate Bar Charts, Pie Charts, Line Charts, or Scatter Plots.
* **Zero-Code Analytics:** Empowers non-technical business users to perform advanced data science operations without writing a single line of code.

---

### Slide 4: Tech Stack Used
* **Frontend (User Interface):**
  * **React & Vite:** For a lightning-fast, modern web application.
  * **Tailwind CSS v4:** For a premium, dark-mode, minimalist design.
  * **Framer Motion:** For smooth, dynamic chart mounting animations.
* **Backend (API & Data Engine):**
  * **FastAPI (Python):** For high-speed, asynchronous HTTP communication.
  * **Pandas:** The core engine for loading, parsing, and manipulating CSV data in memory.
  * **Matplotlib & Seaborn:** For rendering high-quality, statistical data visualizations.
* **AI & Orchestration Engine:**
  * **Groq API (Llama 3.3 70B):** For ultra-fast, near-instantaneous LLM inference.
  * **FastMCP (Model Context Protocol):** To securely register Python functions as JSON-schema tools that the LLM can trigger natively.

---

### Slide 5: System Architecture
*(Insert the image of your Architecture Diagram here)*

**Key Architectural Highlights:**
1. **Client-Server Separation:** React handles the UI and state, while FastAPI handles heavy data processing.
2. **Context Window Optimization:** To prevent AI hallucinations and token limits, the backend only sends a **50-row structural sample** of the dataset to the LLM, keeping the massive dataset secure in local backend RAM.
3. **Native Tool Calling:** The architecture strictly follows the **Model Context Protocol (MCP)**, treating the AI as an intelligent router rather than a generic text generator.

---

### Slide 6: Step-by-Step Workflow (How it Works)
* **Phase 1: Data Ingestion**
  * User drags and drops a CSV into the React UI.
  * FastAPI receives the file and loads it entirely into `Pandas` memory (`state.df`).
  * The frontend dynamically updates to show the dataset schema (columns and row count).
* **Phase 2: LLM Orchestration**
  * User asks a natural language question.
  * FastAPI extracts the JSON tool schemas from the `FastMCP Registry` (e.g., `get_plot`, `get_summary`).
  * The query, the 50-row data sample, and the schemas are sent to the Groq API.
* **Phase 3: Native Execution & Rendering**
  * The LLM evaluates the prompt and returns a **Native Tool Call JSON** object.
  * FastAPI intercepts this, natively executes the Python function (like drawing a Seaborn chart), and converts the output to a Base64 string.
  * The React UI receives the final JSON payload and renders the text, HTML tables, and Base64 images seamlessly.

---

### Slide 7: Live Demonstration (Optional)
* **Demo 1:** Uploading a dataset (`sample_sales_data.csv`).
* **Demo 2:** Asking for a statistical summary (*"Give me a summary of the data"*).
* **Demo 3:** Generating dynamic charts (*"Show me a pie chart of Category vs Sales"* or *"Plot a scatter graph"*).
* **Demo 4:** Instant Math (*"What is the total revenue of all electronics?"*).

---

### Slide 8: Future Enhancements & Conclusion
* **Future Scope:**
  * Adding Machine Learning capabilities (Predictive Trendlines via Linear Regression).
  * Outlier detection using Interquartile Range (IQR) algorithms.
  * Support for Multi-CSV Joins (comparing two different files).
* **Conclusion:** DataPilot AI successfully bridges the gap between raw data and actionable business intelligence using cutting-edge Agentic LLM frameworks.

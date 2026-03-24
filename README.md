# Global Ontology Engine (GOE)

The Global Ontology Engine (GOE) is a strategic intelligence platform that continuously ingests global events, extracts geopolitical entities, maps their relations into a Neo4j Knowledge Graph, and uses GraphRAG powered by LLaMA to answer complex strategic questions.

## Features
- **Knowledge Graph**: Interactive Cytoscape.js visualization of countries, organizations, and geopolitical relations.
- **GraphRAG Intelligence**: LLaMA-powered chat panel that uses semantic context and graph traversal to generate highly grounded intelligence reports.
- **Geopolitical Map**: Dark-themed Leaflet map tracking global conflict and diplomatic hotspots.
- **Live Event Ingestion**: Feed of breaking geopolitical events.

## Prerequisites
Before you begin, ensure you have the following installed on your machine:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Required for the backend databases and API)
- [Node.js](https://nodejs.org/) (v18+ recommended)
- A [Groq API Key](https://console.groq.com/) for LLaMA-based AI reasoning.

## Installation Guidelines

### 1. Setup Environment Variables
Create a file named `.env` in the root of the `bie-goe` project:
```env
GROQ_API_KEY=your_groq_api_key_here
```

### 2. Start the Backend Infrastructure
The entire backend (FastAPI, Neo4j, Qdrant, PostgreSQL, Redis) is completely containerized.

Open a terminal in the root `bie-goe` directory and run:
```bash
docker-compose up -d --build backend
```
*Note: This will download all necessary Docker images and start the Python backend. The API will be available at `http://localhost:8000`.*

### 3. Start the Frontend Dashboard
The frontend is built with React, Vite, and Tailwind CSS. 

Open a **new** terminal, navigate to the `frontend` folder, and install the dependencies:
```bash
cd frontend
npm install
npm run dev
```

### 4. Access the Application
- **Frontend Dashboard:** Open your browser to `http://localhost:5173` (or the port specified by Vite in your terminal).
- **Interactive Backend API:** Open `http://localhost:8000/docs` to view the server health, manually trigger data ingestion, or test the GraphRAG endpoints via Swagger.

## Usage
1. First, make sure the backend is fully running by checking `http://localhost:8000/health`.
2. Open the frontend dashboard.
3. The app will automatically render the initial Knowledge Graph and Geopolitical Hotspots onto the map.
4. Use the **GraphRAG Agent** panel on the left to ask strategic geopolitical questions (e.g. *"What is the state of India-China border tensions?"*) and receive analytical intelligence.

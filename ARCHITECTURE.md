# Chat-Bot Architecture Overview

This document provides a high-level overview of the architecture within the `chat-bot` codebase, focusing on the interaction between the frontend and backend, the structure and flow of the backend API, notable architectural patterns, and the overall organization of the system.

---

## 1. System Overview

The `chat-bot` project is a full-stack TypeScript application built with [Next.js](https://nextjs.org/) (React) for the frontend and a modular API backend. It is designed for extensibility, supporting advanced conversational flows, agent-based reasoning, and hybrid state management.

---

## 2. High-Level Architecture

```mermaid
flowchart TD
    subgraph Frontend [Frontend (Next.js/React)]
        A1[User Interface<br/>(pages/components)]
        A2[Client-side State<br/>(local/hybrid)]
    end
    subgraph API [Backend API (Next.js API Routes)]
        B1[API Endpoints<br/>(/api/chat, /api/conversations)]
        B2[Handlers & Services]
        B3[Agent Engine<br/>(react-agent, tools)]
        B4[Database Service<br/>(Drizzle ORM)]
    end
    subgraph DB [Database]
        C1[(PostgreSQL/SQLite)]
    end

    A1 -- HTTP (fetch/AJAX) --> B1
    A2 -- Read/Write State --> A1
    B1 -- Route Request --> B2
    B2 -- Invoke Agent/Tools --> B3
    B2 -- Persist/Retrieve Data --> B4
    B4 -- SQL --> C1
    B3 -- Tooling/Reasoning --> B2
    B1 -- JSON Response --> A1
```

---

## 3. Frontend

- **Framework:** Next.js (React)
- **Location:** `app/`, `components/`
- **Key Pages:**
  - `app/page.tsx`: Main entry point
  - `app/chat/[id]/page.tsx`, `app/chat/new/page.tsx`: Chat interfaces
  - `app/history/page.tsx`: Conversation history

**Interaction with Backend:**

- Uses `fetch` or similar HTTP clients to call backend API endpoints (e.g., `/api/chat`, `/api/conversations`).
- Sends user messages, receives bot responses, and manages conversation state.
- State is managed both locally (browser storage) and via backend persistence (hybrid model).

---

## 4. Backend API

- **Framework:** Next.js API Routes (modular, file-based routing)
- **Location:** `app/api/`
- **Key Endpoints:**
  - `/api/chat`: Handles chat message processing
  - `/api/conversations`: Manages conversation creation, retrieval, and updates
  - `/api/conversations/[id]`: Operations on specific conversations

**API Structure:**

- Each endpoint has a `route.ts` for routing and `handlers/` for HTTP method logic (e.g., `post.ts`, `get.ts`, `delete.ts`).
- Business logic is encapsulated in service files (e.g., `conversation-service.ts`, `chat-service.ts`).

**Flow:**

1. **Frontend** sends a request (e.g., new message) to an API endpoint.
2. **API Route** delegates to the appropriate handler.
3. **Handler** invokes service logic, which may:
   - Call the **agent engine** for reasoning or tool use.
   - Persist/retrieve data via the **database service**.
4. **Response** is returned as JSON to the frontend.

---

## 5. Agent Engine & Tooling

- **Location:** `lib/agent/`, `lib/tools/`
- **Core:** `react-agent.ts` (agent logic), `tool-registry.ts` (pluggable tools)
- **Features:**
  - Supports advanced reasoning, tool use, and multi-step workflows.
  - Tools include negotiation, FAQ handling, license validation, and more.
  - Tools are registered and invoked dynamically by the agent.

---

## 6. State Management

- **Hybrid Persistence:**
  - **Client-side:** Uses browser storage for fast, local state (see `lib/services/local-storage-service.ts`).
  - **Server-side:** Persists conversations and messages in the database (see `lib/services/hybrid-persistence-service.ts`, `db/`).
  - **Synchronization:** Hybrid service ensures state consistency between client and server.

---

## 7. Database Layer

- **ORM:** Drizzle ORM
- **Location:** `db/`
- **Schema:** Defined in `schema.ts`
- **Migrations:** SQL files in `db/migrations/`
- **Service Layer:** `db/services/drizzle-service.ts` abstracts database operations.

---

## 8. Architectural Patterns & Extensibility

- **Separation of Concerns:** Clear division between UI, API, business logic, agent/tooling, and persistence.
- **Modularity:** Handlers, services, and tools are decoupled for easy extension.
- **Agent Pattern:** Central agent coordinates reasoning and tool invocation.
- **Pluggable Tools:** New tools can be added to the agent with minimal changes.
- **Hybrid State:** Supports both offline and persistent chat experiences.

---

## 9. File/Directory Structure (Key Areas)

- `app/` — Next.js pages, layouts, and API routes
- `components/` — Reusable UI components
- `lib/` — Shared logic, agent, tools, and services
- `db/` — Database schema, migrations, and service layer
- `public/` — Static assets

---

## 10. Summary

The `chat-bot` codebase is architected for flexibility, extensibility, and advanced conversational AI. The frontend and backend communicate via well-defined API endpoints, with a robust agent engine enabling complex workflows and tool use. Hybrid state management ensures a seamless user experience, while modular design supports rapid iteration and feature growth.

# AI Multi-Agent Development Platform (Phase 2)

Phase 2 extends the production-oriented foundation into a modular agent team for general software engineering guidance.

Implemented in this phase:

- One orchestrator
- A specialist agent team for broad development questions
- OpenAI API integration
- CLI request flow
- HTTP API request flow
- Browser-based chat UI served by the same backend
- Streaming responses in the browser UI
- Session-scoped in-memory conversation history
- Smarter routing using profile overlap, keyword scoring, and follow-up continuity
- Lightweight JavaScript runtime designed for straightforward deployment

## Why this architecture

This phase still avoids advanced agent-to-agent collaboration logic and focuses on stable multi-agent routing.

Key decisions:

- **Orchestrator has no domain knowledge**: it only selects and invokes agents.
- **Agents encapsulate expertise**: domain behavior lives in specialist prompts and agent definitions.
- **Composition root in one place**: dependency wiring is centralized in `src/index.js`.
- **Clear module boundaries**: the runtime stays simple without a transpilation layer.
- **Validation at boundaries**: env validation via Zod and request validation in HTTP layer.

Tradeoffs:

- Agent routing is intentionally hybrid and lightweight rather than model-routed, to keep Phase 2 understandable and inexpensive.
- No memory, persistence, or cross-agent collaboration yet by design.
- Single-process runtime is enough for now; can later split orchestrator and agents into separate services.

## Tech Stack

- Node.js 20+
- JavaScript (ES modules)
- OpenAI SDK
- Express
- dotenv
- Zod
- Pino
- ESLint + Prettier

## Project Structure

```text
src/
  agents/
    backend.agent.js
    frontend.agent.js
    cloud-architect.agent.js
    devops.agent.js
    database.agent.js
    security.agent.js
    solution-architect.agent.js
    code-reviewer.agent.js
  orchestrator/
    orchestrator.js
  services/
    openai.service.js
  prompts/
    backend.prompt.js
  interfaces/
    http.js
  config/
    env.js
    logger.js
  index.js

netlify/
  functions/
    api.js

docs/
  architecture.md
```

## Setup

1. Install dependencies

```bash
npm install
```

2. Create environment file

```bash
copy .env.example .env
```

3. Add your key in `.env`

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4.1-mini
PORT=3000
LOG_LEVEL=info
```

## Run

### CLI mode

Pass a question as CLI args:

```bash
npm run dev -- "How should I design a scalable Express API with auth?"
```

Flow:

1. `index.js` creates orchestrator and agents
2. Orchestrator receives question
3. Orchestrator selects the best matching specialist or the fallback architect
4. Selected specialist calls OpenAI through service
5. Response is returned to terminal

### HTTP mode

Start server without CLI args:

```bash
npm run dev
```

Browser UI:

```bash
http://localhost:3000/
```

This is the recommended way to use the platform day to day in Phase 2. The UI can either auto-route to the best specialist or target a specific agent explicitly.

The browser UI now streams responses as they arrive and keeps a simple session history in memory for the lifetime of the server process, while also preserving the visible chat locally in the browser session.

Health check:

```bash
GET http://localhost:3000/health
```

Ask endpoint:

```bash
POST http://localhost:3000/ask
Content-Type: application/json

{
  "question": "How should I structure my Node.js service layer?",
  "agentId": "backend-expert"
}
```

Agent directory endpoint:

```bash
GET http://localhost:3000/agents
```

Streaming endpoint:

```bash
POST http://localhost:3000/ask/stream
Content-Type: application/json

{
  "question": "How should I deploy this Node.js service?",
  "sessionId": "optional-session-id",
  "agentId": "devops-engineer"
}
```

Session history endpoint:

```bash
GET http://localhost:3000/sessions/<sessionId>/history
```

## Agent team

Current specialists:

- `solution-architect`
- `backend-expert`
- `frontend-expert`
- `cloud-architect`
- `devops-engineer`
- `database-engineer`
- `security-engineer`
- `code-reviewer`

The solution architect acts as the default fallback for broad engineering questions. Other specialists are selected through keyword-based match scoring or explicit agent override.

Routing is now smarter than plain keyword matching. Each specialist score combines:

- explicit agent override
- domain keyword hits
- overlap between the request and the agent profile
- follow-up continuity from recent session history

## UI design choice

The project now exposes a simple built-in chat frontend instead of relying on editor-only tooling.

Why this is the right Phase 2 choice:

- The platform keeps a stable HTTP boundary that future clients can reuse.
- The UI remains thin, so orchestration and agent behavior stay in the backend.
- You get a normal product interface now without introducing frontend framework complexity too early.

## Quality Commands

```bash
npm run lint
npm run format:check
npm run build
```

## How to add new agents

1. Create a prompt in `src/prompts/`
2. Create an agent class in `src/agents/` implementing `Agent`
3. Register the agent in `src/index.js`
4. Update routing keywords or specialist scoring as needed
5. Add tests for agent selection and execution flow

Suggested next agents:

- QA agent
- Product engineer agent
- Data/AI platform agent

## Current limitations (intentional for Phase 2)

- No agent-to-agent collaboration
- No persistent memory beyond process lifetime
- No GitHub integration

These are deferred to later phases to keep the team architecture clean and understandable.

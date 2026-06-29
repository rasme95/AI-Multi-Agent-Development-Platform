# Architecture (Phase 2)

## Components

- **Orchestrator** (`src/orchestrator/orchestrator.ts`)
  - Receives user request
  - Selects agent(s)
  - Executes selected agent
  - Returns unified result

- **Specialist Agents** (`src/agents/*.agent.ts`)
  - Own domain expertise and behavior
  - Use specialized system prompts and keyword-scored routing
  - Call OpenAI through service abstraction

- **OpenAI Service** (`src/services/openai.service.ts`)
  - Isolates SDK usage from business logic
  - Enables easy mocking and provider swapping later

- **Interfaces** (`src/interfaces/http.ts`)
  - Handles transport concerns (HTTP)
  - Validates input
  - Keeps framework details out of orchestrator and agents

- **Config** (`src/config/*`)
  - Validates environment variables with Zod
  - Centralizes logger setup

## Sequence

1. User sends question (CLI or HTTP)
2. `Orchestrator.handleRequest` honors optional explicit agent selection or chooses the highest-scoring specialist
3. Agent executes with request context
4. Agent asks OpenAI service for response
5. Orchestrator returns final answer payload

## Extensibility path

To support future phases without refactoring core boundaries:
- Keep orchestrator domain-agnostic
- Replace keyword scoring with richer routing strategy (classifier, policies, or evaluation)
- Add inter-agent message bus abstraction for collaboration
- Add conversation/memory repository interfaces
- Add telemetry and tracing per requestId

## Dependency flow

`index.ts` is the composition root and wires dependencies downward:

- config -> service -> agents -> orchestrator -> interfaces

No upward imports are allowed. This keeps dependencies acyclic and maintainable.

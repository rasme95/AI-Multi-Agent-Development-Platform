# AGENTS.md

Guidance for AI coding agents working in this repository.

## Scope

This repository is currently **Phase 2 multi-agent routing**.
Do not implement agent-to-agent collaboration, persistent memory, or autonomous workflows unless explicitly asked.

## Architecture rules

- Keep orchestrator domain-agnostic.
- Put expertise in agent prompts and agent implementations.
- Keep OpenAI SDK usage inside `src/services/openai.service.ts`.
- Keep dependency wiring in `src/index.ts`.
- Maintain strict typing at module boundaries.

## Development workflow

Use these commands before finishing work:

```bash
npm run typecheck
npm run lint
npm run build
```

## Coding conventions

- Prefer small modules over large files.
- Avoid duplication and hidden coupling.
- Validate all untrusted input at boundaries.
- Use async/await and avoid callback-style code.
- Keep logs structured and include request IDs where possible.

## Extension pattern

When adding a new agent:
1. Add prompt in `src/prompts/`
2. Add agent in `src/agents/` implementing `Agent`
3. Register in `src/index.ts`
4. Adjust orchestrator selection only through agent contracts and scoring, not hardcoded domain logic in the orchestrator

## Non-goals for now

- Agent-to-agent collaboration
- Persistent memory
- Vector database integration
- GitHub automation workflows

Add these only in future phases to preserve incremental architecture.

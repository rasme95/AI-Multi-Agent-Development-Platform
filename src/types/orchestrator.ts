import type { AgentExecutionInput } from "./agent.js";

export type OrchestratorRequest = AgentExecutionInput;

export interface OrchestratorResult {
  requestId: string;
  sessionId?: string;
  selectedAgentId: string;
  answer: string;
}

export interface OrchestratorStreamResult {
  requestId: string;
  sessionId?: string;
  selectedAgentId: string;
  stream: AsyncIterable<string>;
}

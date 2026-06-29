import type { ConversationTurn } from "./conversation.js";

export interface AgentExecutionInput {
  userRequest: string;
  requestId: string;
  preferredAgentId?: string;
  sessionId?: string;
  conversationHistory?: ConversationTurn[];
}

export interface AgentExecutionOutput {
  answer: string;
}

export interface AgentSummary {
  id: string;
  description: string;
}

export interface Agent {
  readonly id: string;
  readonly description: string;
  matchScore(input: AgentExecutionInput): number | Promise<number>;
  execute(input: AgentExecutionInput): Promise<AgentExecutionOutput>;
  streamExecute(input: AgentExecutionInput): AsyncIterable<string> | Promise<AsyncIterable<string>>;
}

import type pino from "pino";

import type { Agent, AgentSummary } from "../types/agent.js";
import type {
  OrchestratorRequest,
  OrchestratorResult,
  OrchestratorStreamResult
} from "../types/orchestrator.js";

export interface OrchestratorOptions {
  defaultAgentId?: string;
}

export class Orchestrator {
  public constructor(
    private readonly agents: Agent[],
    private readonly logger: pino.Logger,
    private readonly options: OrchestratorOptions = {}
  ) {
    if (this.agents.length === 0) {
      throw new Error("Orchestrator requires at least one agent");
    }
  }

  public async handleRequest(request: OrchestratorRequest): Promise<OrchestratorResult> {
    const selectedAgent = await this.selectAgent(request);
    this.logSelectedAgent(request.requestId, selectedAgent.id, false);
    const result = await selectedAgent.execute(request);

    return this.createRequestResult(request, selectedAgent.id, result.answer);
  }

  public async streamRequest(request: OrchestratorRequest): Promise<OrchestratorStreamResult> {
    const selectedAgent = await this.selectAgent(request);
    this.logSelectedAgent(request.requestId, selectedAgent.id, true);

    const stream = await selectedAgent.streamExecute(request);
    const result = {
      requestId: request.requestId,
      selectedAgentId: selectedAgent.id,
      stream
    };

    if (!request.sessionId) {
      return result;
    }

    return {
      ...result,
      sessionId: request.sessionId
    };
  }

  public listAgents(): AgentSummary[] {
    return this.agents.map((agent) => ({
      id: agent.id,
      description: agent.description
    }));
  }

  private createRequestResult(
    request: OrchestratorRequest,
    selectedAgentId: string,
    answer: string
  ): OrchestratorResult {
    const result = {
      requestId: request.requestId,
      selectedAgentId,
      answer
    };

    if (!request.sessionId) {
      return result;
    }

    return {
      ...result,
      sessionId: request.sessionId
    };
  }

  private logSelectedAgent(requestId: string, agentId: string, isStreaming: boolean): void {
    const message = isStreaming ? "Selected agent for streaming" : "Selected agent";
    this.logger.debug({ requestId, agentId }, message);
  }

  private findPreferredAgent(preferredAgentId?: string): Agent | undefined {
    if (!preferredAgentId) {
      return undefined;
    }

    return this.agents.find((agent) => agent.id === preferredAgentId);
  }

  private findDefaultAgent(): Agent | undefined {
    if (!this.options.defaultAgentId) {
      return undefined;
    }

    return this.agents.find((agent) => agent.id === this.options.defaultAgentId);
  }

  private async findBestScoringAgent(request: OrchestratorRequest): Promise<Agent | undefined> {
    let bestAgent: Agent | undefined;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (const agent of this.agents) {
      const score = await agent.matchScore(request);
      if (score > bestScore) {
        bestAgent = agent;
        bestScore = score;
      }
    }

    return bestAgent;
  }

  private async selectAgent(request: OrchestratorRequest): Promise<Agent> {
    const preferredAgent = this.findPreferredAgent(request.preferredAgentId);
    if (preferredAgent) {
      return preferredAgent;
    }

    const bestAgent = await this.findBestScoringAgent(request);
    if (bestAgent) {
      return bestAgent;
    }

    const defaultAgent = this.findDefaultAgent();
    if (defaultAgent) {
      return defaultAgent;
    }

    const firstAgent = this.agents[0];
    if (!firstAgent) {
      throw new Error("Orchestrator has no available agents");
    }

    return firstAgent;
  }
}

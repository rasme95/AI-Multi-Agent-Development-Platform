export class Orchestrator {
  constructor(agents, logger, options = {}) {
    this.agents = agents;
    this.logger = logger;
    this.options = options;

    if (this.agents.length === 0) {
      throw new Error("Orchestrator requires at least one agent");
    }
  }

  async handleRequest(request) {
    const selectedAgent = await this.selectAgent(request);
    this.logSelectedAgent(request.requestId, selectedAgent.id, false);
    const result = await selectedAgent.execute(request);

    return this.createRequestResult(request, selectedAgent.id, result.answer);
  }

  async streamRequest(request) {
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

  listAgents() {
    return this.agents.map((agent) => ({
      id: agent.id,
      description: agent.description
    }));
  }

  createRequestResult(request, selectedAgentId, answer) {
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

  logSelectedAgent(requestId, agentId, isStreaming) {
    const message = isStreaming ? "Selected agent for streaming" : "Selected agent";
    this.logger.debug({ requestId, agentId }, message);
  }

  findPreferredAgent(preferredAgentId) {
    if (!preferredAgentId) {
      return undefined;
    }

    return this.agents.find((agent) => agent.id === preferredAgentId);
  }

  findDefaultAgent() {
    if (!this.options.defaultAgentId) {
      return undefined;
    }

    return this.agents.find((agent) => agent.id === this.options.defaultAgentId);
  }

  async findBestScoringAgent(request) {
    let bestAgent;
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

  async selectAgent(request) {
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

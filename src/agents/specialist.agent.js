import { calculateKeywordMatchScore } from "./keyword-matcher.js";

const platformResponseConstraints = `
Platform constraints you must follow:
- This platform executes one selected specialist per request.
- Do not claim that multiple agents have collaborated in the current answer.
- If asked to involve other agents, clearly state that cross-agent collaboration is not active in this phase and give the best single-agent guidance instead.
- Do not start with role-introduction text like "I am the X agent" unless explicitly asked for your role.
- Focus on solving the user's concrete question directly.
`.trim();

export class SpecialistAgent {
  constructor(openAIService, model, config) {
    this.openAIService = openAIService;
    this.model = model;
    this.config = config;
    this.id = config.id;
    this.description = config.description;
  }

  matchScore(input) {
    const matchOptions = {
      agentId: this.id,
      description: this.description,
      keywords: this.config.keywords
    };

    if (this.config.baselineScore !== undefined) {
      matchOptions.baselineScore = this.config.baselineScore;
    }

    return calculateKeywordMatchScore(input, matchOptions);
  }

  getSystemPrompt() {
    return `${this.config.systemPrompt}\n\n${platformResponseConstraints}`;
  }

  async execute(input) {
    const responseParams = input.conversationHistory
      ? {
          model: this.model,
          systemPrompt: this.getSystemPrompt(),
          userPrompt: input.userRequest,
          conversationHistory: input.conversationHistory
        }
      : {
          model: this.model,
          systemPrompt: this.getSystemPrompt(),
          userPrompt: input.userRequest
        };

    const answer = await this.openAIService.generateResponse(responseParams);

    return { answer };
  }

  streamExecute(input) {
    const responseParams = input.conversationHistory
      ? {
          model: this.model,
          systemPrompt: this.getSystemPrompt(),
          userPrompt: input.userRequest,
          conversationHistory: input.conversationHistory
        }
      : {
          model: this.model,
          systemPrompt: this.getSystemPrompt(),
          userPrompt: input.userRequest
        };

    return this.openAIService.streamResponse(responseParams);
  }
}

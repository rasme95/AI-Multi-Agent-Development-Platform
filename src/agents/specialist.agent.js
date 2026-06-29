import { calculateKeywordMatchScore } from "./keyword-matcher.js";

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

  async execute(input) {
    const responseParams = input.conversationHistory
      ? {
          model: this.model,
          systemPrompt: this.config.systemPrompt,
          userPrompt: input.userRequest,
          conversationHistory: input.conversationHistory
        }
      : {
          model: this.model,
          systemPrompt: this.config.systemPrompt,
          userPrompt: input.userRequest
        };

    const answer = await this.openAIService.generateResponse(responseParams);

    return { answer };
  }

  streamExecute(input) {
    const responseParams = input.conversationHistory
      ? {
          model: this.model,
          systemPrompt: this.config.systemPrompt,
          userPrompt: input.userRequest,
          conversationHistory: input.conversationHistory
        }
      : {
          model: this.model,
          systemPrompt: this.config.systemPrompt,
          userPrompt: input.userRequest
        };

    return this.openAIService.streamResponse(responseParams);
  }
}

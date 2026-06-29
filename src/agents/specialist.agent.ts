import type { OpenAIService } from "../services/openai.service.js";
import type { Agent, AgentExecutionInput, AgentExecutionOutput } from "../types/agent.js";

import { calculateKeywordMatchScore } from "./keyword-matcher.js";

export interface SpecialistAgentConfig {
  id: string;
  description: string;
  systemPrompt: string;
  keywords: string[];
  baselineScore?: number;
}

export abstract class SpecialistAgent implements Agent {
  public readonly id: string;
  public readonly description: string;

  protected constructor(
    private readonly openAIService: OpenAIService,
    private readonly model: string,
    private readonly config: SpecialistAgentConfig
  ) {
    this.id = config.id;
    this.description = config.description;
  }

  public matchScore(input: AgentExecutionInput): number {
    const matchOptions = this.config.baselineScore === undefined
      ? {
          agentId: this.id,
          description: this.description,
          keywords: this.config.keywords
        }
      : {
          agentId: this.id,
          description: this.description,
          keywords: this.config.keywords,
          baselineScore: this.config.baselineScore
        };

    return calculateKeywordMatchScore(input, matchOptions);
  }

  public async execute(input: AgentExecutionInput): Promise<AgentExecutionOutput> {
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

  public streamExecute(input: AgentExecutionInput): AsyncIterable<string> {
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

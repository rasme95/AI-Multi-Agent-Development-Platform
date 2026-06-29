import { backendAgentSystemPrompt } from "../prompts/backend.prompt.js";
import type { OpenAIService } from "../services/openai.service.js";
import { SpecialistAgent } from "./specialist.agent.js";

const backendKeywords = [
  "backend",
  "node",
  "typescript",
  "express",
  "api",
  "rest",
  "authentication",
  "authorization",
  "service layer",
  "repository",
  "endpoint",
  "server"
];

export class BackendAgent extends SpecialistAgent {
  public constructor(openAIService: OpenAIService, model: string) {
    super(openAIService, model, {
      id: "backend-expert",
      description: "Backend engineering specialist for Node.js and TypeScript systems.",
      systemPrompt: backendAgentSystemPrompt,
      keywords: backendKeywords
    });
  }
}

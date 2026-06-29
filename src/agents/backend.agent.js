import { backendAgentSystemPrompt } from "../prompts/backend.prompt.js";
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
  constructor(openAIService, model) {
    super(openAIService, model, {
      id: "backend-expert",
      description: "Backend engineering specialist for Node.js and JavaScript service systems.",
      systemPrompt: backendAgentSystemPrompt,
      keywords: backendKeywords
    });
  }
}

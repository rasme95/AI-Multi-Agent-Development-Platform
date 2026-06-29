import { frontendAgentSystemPrompt } from "../prompts/frontend.prompt.js";
import type { OpenAIService } from "../services/openai.service.js";

import { SpecialistAgent } from "./specialist.agent.js";

export class FrontendAgent extends SpecialistAgent {
  public constructor(openAIService: OpenAIService, model: string) {
    super(openAIService, model, {
      id: "frontend-expert",
      description: "Frontend engineering specialist for UI architecture, React, and browser UX.",
      systemPrompt: frontendAgentSystemPrompt,
      keywords: [
        "frontend",
        "ui",
        "ux",
        "react",
        "component",
        "state",
        "browser",
        "css",
        "html",
        "responsive",
        "accessibility"
      ]
    });
  }
}

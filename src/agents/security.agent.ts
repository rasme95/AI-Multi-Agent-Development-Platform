import { securityAgentSystemPrompt } from "../prompts/security.prompt.js";
import type { OpenAIService } from "../services/openai.service.js";

import { SpecialistAgent } from "./specialist.agent.js";

export class SecurityAgent extends SpecialistAgent {
  public constructor(openAIService: OpenAIService, model: string) {
    super(openAIService, model, {
      id: "security-engineer",
      description: "Security specialist for secure design, auth boundaries, and application risk.",
      systemPrompt: securityAgentSystemPrompt,
      keywords: [
        "security",
        "owasp",
        "vulnerability",
        "secure",
        "threat",
        "secret",
        "authentication",
        "authorization",
        "encryption",
        "csrf",
        "xss"
      ]
    });
  }
}

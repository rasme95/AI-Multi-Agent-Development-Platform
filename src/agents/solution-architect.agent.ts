import { solutionArchitectAgentSystemPrompt } from "../prompts/solution-architect.prompt.js";
import type { OpenAIService } from "../services/openai.service.js";

import { SpecialistAgent } from "./specialist.agent.js";

export class SolutionArchitectAgent extends SpecialistAgent {
  public constructor(openAIService: OpenAIService, model: string) {
    super(openAIService, model, {
      id: "solution-architect",
      description: "General architecture specialist for broad engineering and system design questions.",
      systemPrompt: solutionArchitectAgentSystemPrompt,
      keywords: [
        "architecture",
        "system design",
        "tradeoff",
        "scalable",
        "modular",
        "microservice",
        "monolith",
        "platform",
        "integration",
        "design"
      ],
      baselineScore: 5
    });
  }
}

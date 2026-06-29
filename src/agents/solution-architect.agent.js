import { solutionArchitectAgentSystemPrompt } from "../prompts/solution-architect.prompt.js";

import { SpecialistAgent } from "./specialist.agent.js";

export class SolutionArchitectAgent extends SpecialistAgent {
  constructor(openAIService, model) {
    super(openAIService, model, {
      id: "solution-architect",
      description:
        "General architecture specialist for broad engineering and system design questions.",
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

import { cloudArchitectAgentSystemPrompt } from "../prompts/cloud.prompt.js";

import { SpecialistAgent } from "./specialist.agent.js";

export class CloudArchitectAgent extends SpecialistAgent {
  constructor(openAIService, model) {
    super(openAIService, model, {
      id: "cloud-architect",
      description:
        "Cloud architecture specialist for infrastructure, scalability, and platform design.",
      systemPrompt: cloudArchitectAgentSystemPrompt,
      keywords: [
        "cloud",
        "aws",
        "azure",
        "gcp",
        "kubernetes",
        "terraform",
        "infrastructure",
        "load balancer",
        "container",
        "scaling",
        "serverless"
      ]
    });
  }
}

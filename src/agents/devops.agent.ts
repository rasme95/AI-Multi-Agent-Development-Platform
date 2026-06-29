import { devOpsAgentSystemPrompt } from "../prompts/devops.prompt.js";
import type { OpenAIService } from "../services/openai.service.js";

import { SpecialistAgent } from "./specialist.agent.js";

export class DevOpsAgent extends SpecialistAgent {
  public constructor(openAIService: OpenAIService, model: string) {
    super(openAIService, model, {
      id: "devops-engineer",
      description: "DevOps specialist for CI/CD, deployment automation, and operability.",
      systemPrompt: devOpsAgentSystemPrompt,
      keywords: [
        "devops",
        "ci",
        "cd",
        "pipeline",
        "github actions",
        "docker",
        "deploy",
        "deployment",
        "release",
        "monitoring",
        "observability"
      ]
    });
  }
}

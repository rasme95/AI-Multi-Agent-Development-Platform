import { codeReviewerAgentSystemPrompt } from "../prompts/code-review.prompt.js";
import type { OpenAIService } from "../services/openai.service.js";

import { SpecialistAgent } from "./specialist.agent.js";

export class CodeReviewerAgent extends SpecialistAgent {
  public constructor(openAIService: OpenAIService, model: string) {
    super(openAIService, model, {
      id: "code-reviewer",
      description: "Code review specialist for defects, regressions, test gaps, and maintainability.",
      systemPrompt: codeReviewerAgentSystemPrompt,
      keywords: [
        "review",
        "code review",
        "bug",
        "regression",
        "refactor",
        "maintainability",
        "test",
        "lint",
        "typecheck",
        "quality"
      ]
    });
  }
}

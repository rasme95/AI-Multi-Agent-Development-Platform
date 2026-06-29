import { databaseAgentSystemPrompt } from "../prompts/database.prompt.js";

import { SpecialistAgent } from "./specialist.agent.js";

export class DatabaseAgent extends SpecialistAgent {
  constructor(openAIService, model) {
    super(openAIService, model, {
      id: "database-engineer",
      description: "Database specialist for schema design, SQL performance, and data integrity.",
      systemPrompt: databaseAgentSystemPrompt,
      keywords: [
        "database",
        "sql",
        "postgres",
        "mysql",
        "query",
        "schema",
        "migration",
        "index",
        "transaction",
        "data model",
        "normalization"
      ]
    });
  }
}

import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { BackendAgent } from "./agents/backend.agent.js";
import { CloudArchitectAgent } from "./agents/cloud-architect.agent.js";
import { CodeReviewerAgent } from "./agents/code-reviewer.agent.js";
import { DatabaseAgent } from "./agents/database.agent.js";
import { DevOpsAgent } from "./agents/devops.agent.js";
import { FrontendAgent } from "./agents/frontend.agent.js";
import { SecurityAgent } from "./agents/security.agent.js";
import { SolutionArchitectAgent } from "./agents/solution-architect.agent.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { createHttpServer } from "./interfaces/http.js";
import { Orchestrator } from "./orchestrator/orchestrator.js";
import { ConversationStoreService } from "./services/conversation-store.service.js";
import { OpenAIService } from "./services/openai.service.js";

export function createApp() {
  const openAIService = new OpenAIService(env.OPENAI_API_KEY);
  const solutionArchitectAgent = new SolutionArchitectAgent(openAIService, env.OPENAI_MODEL);
  const agents = [
    solutionArchitectAgent,
    new BackendAgent(openAIService, env.OPENAI_MODEL),
    new FrontendAgent(openAIService, env.OPENAI_MODEL),
    new CloudArchitectAgent(openAIService, env.OPENAI_MODEL),
    new DevOpsAgent(openAIService, env.OPENAI_MODEL),
    new DatabaseAgent(openAIService, env.OPENAI_MODEL),
    new SecurityAgent(openAIService, env.OPENAI_MODEL),
    new CodeReviewerAgent(openAIService, env.OPENAI_MODEL)
  ];

  const orchestrator = new Orchestrator(agents, logger, {
    defaultAgentId: solutionArchitectAgent.id
  });
  const conversationStore = new ConversationStoreService();

  return createHttpServer(orchestrator, conversationStore);
}

async function main() {
  const app = createApp();

  const cliQuestion = process.argv.slice(2).join(" ").trim();
  if (cliQuestion.length > 0) {
    const openAIService = new OpenAIService(env.OPENAI_API_KEY);
    const solutionArchitectAgent = new SolutionArchitectAgent(openAIService, env.OPENAI_MODEL);
    const agents = [
      solutionArchitectAgent,
      new BackendAgent(openAIService, env.OPENAI_MODEL),
      new FrontendAgent(openAIService, env.OPENAI_MODEL),
      new CloudArchitectAgent(openAIService, env.OPENAI_MODEL),
      new DevOpsAgent(openAIService, env.OPENAI_MODEL),
      new DatabaseAgent(openAIService, env.OPENAI_MODEL),
      new SecurityAgent(openAIService, env.OPENAI_MODEL),
      new CodeReviewerAgent(openAIService, env.OPENAI_MODEL)
    ];
    const orchestrator = new Orchestrator(agents, logger, {
      defaultAgentId: solutionArchitectAgent.id
    });
    const requestId = crypto.randomUUID();
    const result = await orchestrator.handleRequest({
      userRequest: cliQuestion,
      requestId
    });
    logger.info({ requestId, agentId: result.selectedAgentId }, "CLI request handled");
    console.log(result.answer);
    return;
  }

  app.listen(env.PORT, () => {
    logger.info(
      {
        port: env.PORT,
        model: env.OPENAI_MODEL
      },
      "AI multi-agent platform API started"
    );
  });
}

const entryFilePath = process.argv[1] ? path.resolve(process.argv[1]) : undefined;
const moduleFilePath = fileURLToPath(import.meta.url);

if (entryFilePath === moduleFilePath) {
  main().catch((error) => {
    logger.error({ err: error }, "Fatal startup error");
    process.exitCode = 1;
  });
}

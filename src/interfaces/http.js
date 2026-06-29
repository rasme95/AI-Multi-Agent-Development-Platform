import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import express from "express";
import { z } from "zod";

const askBodySchema = z.object({
  question: z.string().min(1),
  agentId: z.string().min(1).optional(),
  sessionId: z.string().min(1).optional()
});

function isUpstreamApiError(error) {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  return "status" in error || "code" in error || "type" in error;
}

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);
const publicDirPath = path.resolve(currentDirPath, "../../public");

function buildOrchestratorRequest(body, requestId, sessionId, conversationHistory) {
  const baseRequest = {
    userRequest: body.question,
    requestId,
    sessionId,
    conversationHistory
  };

  return body.agentId ? { ...baseRequest, preferredAgentId: body.agentId } : baseRequest;
}

function writeServerEvent(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function createUserTurn(question) {
  return {
    role: "user",
    content: question,
    timestamp: new Date().toISOString()
  };
}

function createAssistantTurn(answer, agentId) {
  return {
    role: "assistant",
    content: answer,
    agentId,
    timestamp: new Date().toISOString()
  };
}

function saveConversationTurns(conversationStore, sessionId, question, answer, agentId) {
  conversationStore.appendTurn(sessionId, createUserTurn(question));
  conversationStore.appendTurn(sessionId, createAssistantTurn(answer, agentId));
}

function startStreamResponse(res) {
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
}

function sendStreamStartEvent(res, requestId, sessionId, selectedAgentId) {
  writeServerEvent(res, {
    type: "start",
    requestId,
    sessionId,
    selectedAgentId
  });
}

function sendStreamEndEvent(res, requestId, sessionId, selectedAgentId, answer) {
  writeServerEvent(res, {
    type: "end",
    requestId,
    sessionId,
    selectedAgentId,
    answer
  });
}

function sendStreamErrorEvent(res, error) {
  writeServerEvent(res, {
    type: "error",
    message: error instanceof Error ? error.message : "Streaming request failed"
  });
}

function createChatRequest(body, requestId, conversationStore) {
  const sessionId = body.sessionId ?? crypto.randomUUID();
  const history = conversationStore.getHistory(sessionId);
  const orchestratorRequest = buildOrchestratorRequest(body, requestId, sessionId, history);

  return {
    sessionId,
    orchestratorRequest
  };
}

async function readAnswerFromStream(stream, res) {
  let answer = "";

  for await (const chunk of stream) {
    answer += chunk;
    writeServerEvent(res, { type: "chunk", delta: chunk });
  }

  return answer;
}

export function createHttpServer(orchestrator, conversationStore) {
  const app = express();

  app.use(express.json());
  app.use(express.static(publicDirPath));

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.get("/agents", (_req, res) => {
    res.status(200).json({ agents: orchestrator.listAgents() });
  });

  app.get("/sessions/:sessionId/history", (req, res) => {
    const history = conversationStore.getHistory(req.params.sessionId);
    res.status(200).json({ sessionId: req.params.sessionId, history });
  });

  app.delete("/sessions/:sessionId", (req, res) => {
    conversationStore.clearHistory(req.params.sessionId);
    res.status(204).send();
  });

  app.get("/", (_req, res) => {
    res.sendFile(path.join(publicDirPath, "index.html"));
  });

  app.post("/ask", async (req, res, next) => {
    try {
      const body = askBodySchema.parse(req.body);
      const requestId = crypto.randomUUID();
      const chatRequest = createChatRequest(body, requestId, conversationStore);
      const { orchestratorRequest, sessionId } = chatRequest;
      const result = await orchestrator.handleRequest(orchestratorRequest);

      saveConversationTurns(
        conversationStore,
        sessionId,
        body.question,
        result.answer,
        result.selectedAgentId
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  app.post("/ask/stream", async (req, res, next) => {
    try {
      const body = askBodySchema.parse(req.body);
      const requestId = crypto.randomUUID();
      const chatRequest = createChatRequest(body, requestId, conversationStore);
      const { orchestratorRequest, sessionId } = chatRequest;
      const result = await orchestrator.streamRequest(orchestratorRequest);

      startStreamResponse(res);
      sendStreamStartEvent(res, result.requestId, sessionId, result.selectedAgentId);

      const answer = await readAnswerFromStream(result.stream, res);

      saveConversationTurns(
        conversationStore,
        sessionId,
        body.question,
        answer,
        result.selectedAgentId
      );

      sendStreamEndEvent(res, result.requestId, sessionId, result.selectedAgentId, answer);

      res.end();
    } catch (error) {
      if (res.headersSent) {
        sendStreamErrorEvent(res, error);
        res.end();
        return;
      }

      next(error);
    }
  });

  app.use((error, _req, res, _next) => {
    void _next;

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "ValidationError",
        details: error.issues
      });
    }

    if (isUpstreamApiError(error)) {
      const status =
        typeof error.status === "number" && error.status >= 400 && error.status <= 599
          ? error.status
          : 502;

      return res.status(status).json({
        error: "UpstreamAIError",
        code: error.code ?? error.type ?? "unknown_error",
        message: error.message ?? "Upstream AI request failed"
      });
    }

    return res.status(500).json({
      error: "InternalServerError"
    });
  });

  return app;
}

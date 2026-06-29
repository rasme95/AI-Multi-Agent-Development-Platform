const form = document.querySelector("#chat-form");
const input = document.querySelector("#question-input");
const messageList = document.querySelector("#message-list");
const sendButton = document.querySelector("#send-button");
const resetButton = document.querySelector("#reset-button");
const statusPill = document.querySelector("#status-pill");
const agentSelect = document.querySelector("#agent-select");

const API_BASE = window.location.hostname.includes("localhost") ? "" : "/.netlify/functions/api";

const SESSION_ID_KEY = "agentops-session-id";
const MESSAGE_HISTORY_KEY = "agentops-session-messages";

const introMessage = {
  role: "assistant",
  title: "Platform",
  text: "Ask a development question to verify the full request path from UI to orchestrator, selected specialist, and OpenAI."
};

let sessionId = sessionStorage.getItem(SESSION_ID_KEY) ?? crypto.randomUUID();
let messages = loadStoredMessages();

function createMessage(role, title, text) {
  return { role, title, text };
}

function getAgentMessageTitle(agentId) {
  return agentId ? `Agent: ${agentId}` : "Agent";
}

function loadStoredMessages() {
  const rawValue = sessionStorage.getItem(MESSAGE_HISTORY_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed)
      ? parsed.filter((message) => {
          return (
            message &&
            typeof message.role === "string" &&
            typeof message.title === "string" &&
            typeof message.text === "string"
          );
        })
      : [];
  } catch {
    return [];
  }
}

function persistSessionState() {
  sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  sessionStorage.setItem(MESSAGE_HISTORY_KEY, JSON.stringify(messages));
}

function saveMessages(nextMessages) {
  messages = nextMessages;
  persistSessionState();
  renderMessages();
}

function renderMessages() {
  messageList.innerHTML = "";
  const entries = messages.length === 0 ? [introMessage] : messages;

  for (const message of entries) {
    const article = document.createElement("article");
    article.className = `message ${message.role}`;

    const roleLabel = document.createElement("p");
    roleLabel.className = "message-role";
    roleLabel.textContent = message.title;

    const body = document.createElement("div");
    body.className = "message-body";
    body.textContent = message.text;

    article.append(roleLabel, body);
    messageList.append(article);
  }

  messageList.scrollTop = messageList.scrollHeight;
}

function pushMessage(message) {
  saveMessages([...messages, message]);
}

function replaceLastMessage(message) {
  if (messages.length === 0) {
    pushMessage(message);
    return;
  }

  saveMessages([...messages.slice(0, -1), message]);
}

function setPendingState(isPending) {
  sendButton.disabled = isPending;
  resetButton.disabled = isPending;
  input.disabled = isPending;
  agentSelect.disabled = isPending;
  statusPill.textContent = isPending ? "Streaming" : "Ready";
}

function updateStatusLabel(selectedAgentId) {
  statusPill.textContent = selectedAgentId ? `Routed: ${selectedAgentId}` : "Ready";
}

function formatError(payload) {
  if (!payload || typeof payload !== "object") {
    return "Request failed.";
  }

  const parts = [];

  if (typeof payload.message === "string" && payload.message.trim().length > 0) {
    parts.push(payload.message.trim());
  }

  if (typeof payload.code === "string" && payload.code.trim().length > 0) {
    parts.push(`Code: ${payload.code.trim()}`);
  }

  if (typeof payload.status === "number") {
    parts.push(`Status: ${payload.status}`);
  }

  if (parts.length > 0) {
    return parts.join(" ");
  }

  if (typeof payload.error === "string" && payload.error.trim().length > 0) {
    return payload.error.trim();
  }

  return "Request failed.";
}

function getRequestBody(question, agentId) {
  const baseRequest = {
    question,
    sessionId
  };

  return agentId ? { ...baseRequest, agentId } : baseRequest;
}

async function loadAgents() {
  const response = await fetch(`${API_BASE}/agents`);
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload || !Array.isArray(payload.agents)) {
    return;
  }

  for (const agent of payload.agents) {
    if (!agent || typeof agent.id !== "string" || typeof agent.description !== "string") {
      continue;
    }

    const option = document.createElement("option");
    option.value = agent.id;
    option.textContent = `${agent.id} - ${agent.description}`;
    agentSelect.append(option);
  }
}

function mapHistoryTurnToMessage(turn) {
  if (turn.role === "user") {
    return createMessage("user", "You", turn.content);
  }

  return createMessage("assistant", getAgentMessageTitle(turn.agentId), turn.content);
}

async function hydrateServerHistory() {
  if (messages.length > 0 || !sessionId) {
    return;
  }

  const response = await fetch(`${API_BASE}/sessions/${sessionId}/history`);
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload || !Array.isArray(payload.history) || payload.history.length === 0) {
    return;
  }

  saveMessages(payload.history.map(mapHistoryTurnToMessage));
}

function getEventPayload(rawEvent) {
  const dataLines = rawEvent
    .split("\n")
    .filter((line) => line.startsWith("data: "))
    .map((line) => line.slice(6));

  if (dataLines.length === 0) {
    return null;
  }

  return JSON.parse(dataLines.join("\n"));
}

function processBufferedEvents(buffer, onEvent) {
  let remainingBuffer = buffer;
  let separatorIndex = remainingBuffer.indexOf("\n\n");

  while (separatorIndex !== -1) {
    const rawEvent = remainingBuffer.slice(0, separatorIndex).trim();
    remainingBuffer = remainingBuffer.slice(separatorIndex + 2);

    if (rawEvent.length > 0) {
      const payload = getEventPayload(rawEvent);
      if (payload) {
        onEvent(payload);
      }
    }

    separatorIndex = remainingBuffer.indexOf("\n\n");
  }

  return remainingBuffer;
}

async function readServerEvents(response, onEvent) {
  if (!response.body) {
    throw new Error("Streaming is not supported in this browser.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
    buffer = processBufferedEvents(buffer, onEvent);

    if (done) {
      break;
    }
  }
}

async function streamQuestion(question, agentId, onEvent) {
  const response = await fetch(`${API_BASE}/ask/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(getRequestBody(question, agentId))
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const textPayload = payload
      ? ""
      : await response
          .text()
          .then((text) => text.trim())
          .catch(() => "");

    if (payload) {
      throw new Error(formatError(payload));
    }

    if (textPayload.length > 0) {
      throw new Error(textPayload);
    }

    throw new Error(`Request failed with status ${response.status}.`);
  }

  await readServerEvents(response, onEvent);
}

async function resetSession() {
  const currentSessionId = sessionId;
  sessionId = crypto.randomUUID();
  saveMessages([]);
  updateStatusLabel("");

  if (currentSessionId) {
    await fetch(`${API_BASE}/sessions/${currentSessionId}`, { method: "DELETE" }).catch(
      () => undefined
    );
  }
}

function addUserQuestion(question) {
  pushMessage(createMessage("user", "You", question));
}

function addPendingAssistantMessage(selectedAgentId) {
  const title = selectedAgentId ? getAgentMessageTitle(selectedAgentId) : "Routing...";
  pushMessage(createMessage("assistant", title, ""));
}

function updateAssistantMessage(title, text) {
  replaceLastMessage(createMessage("assistant", title, text));
}

function showSystemError(message) {
  replaceLastMessage(createMessage("system", "System", message));
}

function updateSessionId(nextSessionId) {
  if (typeof nextSessionId !== "string" || nextSessionId.length === 0) {
    return;
  }

  sessionId = nextSessionId;
  persistSessionState();
}

function handleStreamStart(payload, streamedAnswer) {
  updateSessionId(payload.sessionId);

  if (typeof payload.selectedAgentId === "string") {
    updateStatusLabel(payload.selectedAgentId);
    updateAssistantMessage(getAgentMessageTitle(payload.selectedAgentId), streamedAnswer);
  }
}

function handleStreamChunk(payload, streamedAnswer) {
  const nextAnswer = streamedAnswer + payload.delta;
  const currentTitle = messages[messages.length - 1]?.title ?? "Agent";

  updateAssistantMessage(currentTitle, nextAnswer);
  return nextAnswer;
}

function handleStreamEnd(payload, streamedAnswer) {
  updateSessionId(payload.sessionId);

  let finalAnswer = streamedAnswer;
  if (typeof payload.answer === "string" && finalAnswer.length === 0) {
    finalAnswer = payload.answer;
  }

  const finalTitle =
    typeof payload.selectedAgentId === "string"
      ? getAgentMessageTitle(payload.selectedAgentId)
      : (messages[messages.length - 1]?.title ?? "Agent");

  updateAssistantMessage(finalTitle, finalAnswer);
  return finalAnswer;
}

function handleStreamPayload(payload, streamedAnswer) {
  if (!payload || typeof payload !== "object") {
    return streamedAnswer;
  }

  if (payload.type === "start") {
    handleStreamStart(payload, streamedAnswer);
    return streamedAnswer;
  }

  if (payload.type === "chunk" && typeof payload.delta === "string") {
    return handleStreamChunk(payload, streamedAnswer);
  }

  if (payload.type === "end") {
    return handleStreamEnd(payload, streamedAnswer);
  }

  if (payload.type === "error") {
    throw new Error(formatError(payload));
  }

  return streamedAnswer;
}

async function submitQuestion(question, selectedAgentId) {
  addUserQuestion(question);
  addPendingAssistantMessage(selectedAgentId);

  input.value = "";
  setPendingState(true);

  let streamedAnswer = "";

  try {
    await streamQuestion(question, selectedAgentId, (payload) => {
      streamedAnswer = handleStreamPayload(payload, streamedAnswer);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    showSystemError(message);
    updateStatusLabel("");
  } finally {
    setPendingState(false);
    input.focus();
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const question = input.value.trim();
  if (!question) {
    return;
  }

  const selectedAgentId = agentSelect.value.trim();

  await submitQuestion(question, selectedAgentId);
});

resetButton.addEventListener("click", async () => {
  await resetSession();
});

renderMessages();
loadAgents();
hydrateServerHistory();
input.focus();

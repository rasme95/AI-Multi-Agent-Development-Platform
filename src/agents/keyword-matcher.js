function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length >= 3);
}

function getLastAssistantAgentId(input) {
  const history = input.conversationHistory ?? [];

  for (let index = history.length - 1; index >= 0; index -= 1) {
    const turn = history[index];
    if (turn?.role === "assistant" && turn.agentId) {
      return turn.agentId;
    }
  }

  return undefined;
}

function isFollowUpRequest(userRequest) {
  const normalizedRequest = userRequest.toLowerCase();

  return [
    "also",
    "what about",
    "continue",
    "follow up",
    "same",
    "and",
    "og",
    "fortsett",
    "hva med",
    "samme"
  ].some((phrase) => normalizedRequest.includes(phrase));
}

export function calculateKeywordMatchScore(input, options) {
  const normalizedRequest = input.userRequest.toLowerCase();
  const baselineScore = options.baselineScore ?? 0;
  const maxScore = options.maxScore ?? 100;
  const agentProfileText = `${options.agentId} ${options.description} ${options.keywords.join(" ")}`;
  const requestTokens = new Set(tokenize(normalizedRequest));
  const profileTokens = new Set(tokenize(agentProfileText));

  const matchedKeywords = options.keywords.filter((keyword) => {
    return normalizedRequest.includes(keyword.toLowerCase());
  });

  const overlappingTokens = [...requestTokens].filter((token) => profileTokens.has(token));

  let score = baselineScore;

  if (input.preferredAgentId === options.agentId) {
    score += 100;
  }

  if (normalizedRequest.includes(options.agentId.replaceAll("-", " "))) {
    score += 35;
  }

  score += matchedKeywords.length * 18;
  score += overlappingTokens.length * 5;

  if (getLastAssistantAgentId(input) === options.agentId && isFollowUpRequest(input.userRequest)) {
    score += 16;
  }

  if (matchedKeywords.length === 0 && overlappingTokens.length === 0) {
    return baselineScore;
  }

  return Math.min(score, maxScore);
}

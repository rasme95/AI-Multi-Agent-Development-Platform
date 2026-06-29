export class ConversationStoreService {
  sessions = new Map();

  constructor(maxTurns = 20) {
    this.maxTurns = maxTurns;
  }

  getHistory(sessionId) {
    return [...(this.sessions.get(sessionId) ?? [])];
  }

  appendTurn(sessionId, turn) {
    const nextHistory = [...this.getHistory(sessionId), turn].slice(-this.maxTurns);
    this.sessions.set(sessionId, nextHistory);
    return nextHistory;
  }

  clearHistory(sessionId) {
    this.sessions.delete(sessionId);
  }
}

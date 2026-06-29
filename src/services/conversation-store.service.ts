import type { ConversationTurn } from "../types/conversation.js";

export class ConversationStoreService {
  private readonly sessions = new Map<string, ConversationTurn[]>();

  public constructor(private readonly maxTurns = 20) {}

  public getHistory(sessionId: string): ConversationTurn[] {
    return [...(this.sessions.get(sessionId) ?? [])];
  }

  public appendTurn(sessionId: string, turn: ConversationTurn): ConversationTurn[] {
    const nextHistory = [...this.getHistory(sessionId), turn].slice(-this.maxTurns);
    this.sessions.set(sessionId, nextHistory);
    return nextHistory;
  }

  public clearHistory(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}

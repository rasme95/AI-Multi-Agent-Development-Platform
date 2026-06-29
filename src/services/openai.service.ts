import OpenAI from "openai";

import type { ConversationTurn } from "../types/conversation.js";

export interface GenerateResponseParams {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  conversationHistory?: ConversationTurn[];
}

interface ResponseTextDeltaEvent {
  type?: string;
  delta?: string;
}

export class OpenAIService {
  private readonly client: OpenAI;

  public constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  public async generateResponse(params: GenerateResponseParams): Promise<string> {
    const response = await this.client.responses.create({
      model: params.model,
      instructions: params.systemPrompt,
      input: this.buildInput(params)
    });

    const directOutput = response.output_text?.trim();
    if (directOutput) {
      return directOutput;
    }

    throw new Error("OpenAI response did not include output_text");
  }

  public async *streamResponse(params: GenerateResponseParams): AsyncIterable<string> {
    const stream = await this.client.responses.create({
      model: params.model,
      instructions: params.systemPrompt,
      input: this.buildInput(params),
      stream: true
    });

    let receivedText = false;

    for await (const event of stream as AsyncIterable<ResponseTextDeltaEvent>) {
      if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
        receivedText = true;
        yield event.delta;
      }
    }

    if (!receivedText) {
      throw new Error("OpenAI stream did not include output_text deltas");
    }
  }

  private buildInput(params: GenerateResponseParams): string {
    const history = params.conversationHistory ?? [];
    if (history.length === 0) {
      return params.userPrompt;
    }

    const formattedHistory = history
      .map((turn) => {
        const agentTag = turn.agentId ? ` (${turn.agentId})` : "";
        return `${turn.role.toUpperCase()}${agentTag}: ${turn.content}`;
      })
      .join("\n\n");

    return [
      "Conversation history:",
      formattedHistory,
      "Latest user request:",
      params.userPrompt
    ].join("\n\n");
  }
}

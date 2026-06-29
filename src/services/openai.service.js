import OpenAI from "openai";

export class OpenAIService {
  constructor(apiKey) {
    this.client = new OpenAI({ apiKey });
  }

  async generateResponse(params) {
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

  async *streamResponse(params) {
    const stream = await this.client.responses.create({
      model: params.model,
      instructions: params.systemPrompt,
      input: this.buildInput(params),
      stream: true
    });

    let receivedText = false;

    for await (const event of stream) {
      if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
        receivedText = true;
        yield event.delta;
      }
    }

    if (!receivedText) {
      throw new Error("OpenAI stream did not include output_text deltas");
    }
  }

  buildInput(params) {
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

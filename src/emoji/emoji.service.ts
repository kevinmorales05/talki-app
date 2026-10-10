import { Injectable, Logger } from '@nestjs/common';
import { OpenaiService } from '../openai/openai.service.js';

@Injectable()
export class EmojiService {
  private readonly logger = new Logger(EmojiService.name);

  constructor(private readonly openaiService: OpenaiService) {}

  async generateEmojiPhrase(phrase: string, history: any[]) {
    this.logger.log(`EMOJI mode is enabled. Generating emoji fallback directly via EmojiService.`);
    
    const emojiPrompt = `You are a linguist assisting in creating pictogram sentences using emojis. Given the phrase "${phrase}", break it down into an array of words in order.
For each word, provide an appropriate emoji representing that word. You MUST return actual Unicode emoji characters (e.g., "🧼", "🏠"), not text descriptions (like "soap").
Also, provide a general topic for the phrase, and 1 to 3 examples of phrases with the same structure.
Return ONLY valid JSON in the exact following structure without markdown blocks:
{
  "phrase": [
    {
      "word": "string",
      "order": 0,
      "tags": [],
      "categories": [],
      "pictogram": { "id": -1, "url": null, "emoji": "actual_unicode_emoji_character" }
    }
  ],
  "topic": "string",
  "examples": [
    { "examplePhrase": "string" }
  ]
}
Return ONLY JSON. No other text.`;

    const emojiResponse = await this.openaiService.generateText(emojiPrompt);
    const cleanEmojiJson = emojiResponse.replace(/```json/gi, '').replace(/```/gi, '').trim();
    const emojiData = JSON.parse(cleanEmojiJson);
    
    const emojiResult = {
      history,
      phrase: emojiData.phrase,
      topic: emojiData.topic,
      examples: emojiData.examples,
    };
    
    this.logger.log(`Final Type 1 Payload (EMOJI mode): ${JSON.stringify(emojiResult)}`);
    return emojiResult;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { OpenaiService } from '../openai/openai.service.js';
import { PictogramsService } from '../pictograms/pictograms.service.js';
import { GamesService } from '../games/games.service.js';
import { EmojiService } from '../emoji/emoji.service.js';

export interface ChatMessage {
  type: 'system' | 'user';
  message: string;
}

export interface ChatHistoryPayload {
  history: ChatMessage[];
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly openaiService: OpenaiService,
    private readonly pictogramsService: PictogramsService,
    private readonly gamesService: GamesService,
    private readonly emojiService: EmojiService,
  ) {}

  async analyzeIntention(payload: ChatHistoryPayload) {
    this.logger.log('Analyzing intention...');

    const prompt = `You are an intention analyzer for an app designed to help parents communicate with non-verbal kids, especially those with autism, or to generate practice games.
You will receive a chat history. Based on the last user message and the context, classify the user's intent into one of 4 categories and return ONLY a valid JSON response without any markdown.

Intentions and JSON formats to return:
1. The user asks to build a pictogram sentence to communicate with a non-verbal kid.
Format: {"type": 1, "phraseToComunicate": "clean phrase to ask to convert to pictograms"}

2. The user seeks advice to understand, help to eat, or help a kid with autism. You must return suggestions with official sources, links, and a direct quote.
Format: {"type": 2, "response": "text for the user", "quotes": [{"quote": "direct quote", "url": "official url"}]} (Max 2 quotes)

3. The user wants to generate a practice game with 1 to 5 sentences with pictograms.
Format: {"type": 3, "requirementDefined": "define the requirement of the user to create a training session", "topic": "topic required", "categories": ["categories suggested to use"]}

Chat History:
${JSON.stringify(payload.history)}

Return ONLY JSON. No other text.`;

    try {
      const response = await this.openaiService.generateText(prompt);
      const cleanJson = response.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const intention = JSON.parse(cleanJson);
      this.logger.log(`Parsed Intention JSON: ${JSON.stringify(intention)}`);

      if (intention.type === 1) {
        return this.handleType1Intention(intention.phraseToComunicate, payload.history);
      }

      if (intention.type === 3) {
        return this.handleType3Intention(intention, payload.history);
      }

      return intention;
    } catch (error) {
      this.logger.error('Error in intention analysis', error);
      return {
        type: 4,
        response: 'We are currently experiencing technical difficulties processing your request. Please try again later.'
      };
    }
  }

  private async handleType3Intention(intention: any, history: ChatMessage[]) {
    this.logger.log(`Handling Type 3 Intention for topic: "${intention.topic}"`);
    
    // Call the GamesService to generate the practice games
    const topicToSearch = (intention.topic && intention.topic !== 'topic required' && intention.topic.trim() !== '') ? intention.topic : undefined;
    const practiceGamesData = await this.gamesService.generatePracticeGames(topicToSearch);
    
    const result = {
      type: 3,
      history,
      requirementDefined: intention.requirementDefined,
      topic: practiceGamesData.topic,
      practiceGames: practiceGamesData.practiceGames,
    };
    this.logger.log(`Final Type 3 Payload: ${JSON.stringify(result)}`);
    return result;
  }

  private async handleType1Intention(phrase: string, history: ChatMessage[]) {
    this.logger.log(`Handling Type 1 Intention for phrase: "${phrase}"`);

    if (process.env.EMOJI === 'true') {
      return this.emojiService.generateEmojiPhrase(phrase, history);
    }

    const supercategories = await this.pictogramsService.getSupercategories();
    const supertags = await this.pictogramsService.getSupertags();

    const supercatData = supercategories.map((c) => ({ id: c._id, name: c.name, categories: c.categories }));
    const supertagData = supertags.map((t) => ({ id: t._id, name: t.name, tags: t.tags }));

    const enrichmentPrompt = `You are a linguist assisting in creating pictogram sentences. Given the phrase "${phrase}", break it down into an array of words.
For each word, identify the best matching tags and categories from the provided lists of Supercategories and Supertags.
Also, provide a general topic for the phrase, and 1 to 3 examples of phrases with the same structure.
Return ONLY valid JSON in the exact following structure without markdown blocks:
{
  "phrase": [
    {
      "word": "string",
      "order": 0,
      "tags": [{ "id": "string", "name": "string" }],
      "categories": [{ "id": "string", "name": "string" }]
    }
  ],
  "topic": "string",
  "examples": [
    { "examplePhrase": "string" }
  ]
}

Available Supercategories (with nested categories to choose from):
${JSON.stringify(supercatData)}

Available Supertags (with nested tags to choose from):
${JSON.stringify(supertagData)}
`;

    const enrichmentResponse = await this.openaiService.generateText(enrichmentPrompt);
    const cleanEnrichmentJson = enrichmentResponse.replace(/```json/gi, '').replace(/```/gi, '').trim();
    const enrichedData = JSON.parse(cleanEnrichmentJson);
    this.logger.log(`Enriched Phrase Data: ${JSON.stringify(enrichedData)}`);

    // Fetch matching pictograms for each word
    const allCandidates = [];
    for (const wordItem of enrichedData.phrase) {
      const categoryNames = wordItem.categories.map((c: any) => c.name);
      const tagNames = wordItem.tags.map((t: any) => t.name);

      const candidatePictograms = await this.pictogramsService.findPictogramCandidates(wordItem.word, categoryNames, tagNames);
      allCandidates.push({
        word: wordItem.word,
        order: wordItem.order,
        candidates: candidatePictograms.slice(0, 10).map((p) => ({ id: p.id, url: p.url, keywords: p.keywords })),
      });
    }
    this.logger.log(`All Candidates Array: ${JSON.stringify(allCandidates)}`);

    // Single prompt to pick all best pictograms
    const matchPrompt = `You must pick the BEST pictogram for each word in the phrase based on its candidates.
Return ONLY a valid JSON array of objects, where each object has "order", "word", and "pictogram": { "id": number, "url": "string" }.
If no suitable candidates are provided for a word in the Candidates array, you MUST generate a fallback by providing an emoji representing the word, structured as { "id": -1, "url": null, "emoji": "fallback_emoji" }. Do NOT return null for pictogram.
Words and Candidates:
${JSON.stringify(allCandidates)}
Return ONLY JSON. No other text.`;

    const matchResponse = await this.openaiService.generateText(matchPrompt);
    const cleanMatchJson = matchResponse.replace(/```json/gi, '').replace(/```/gi, '').trim();
    const matchedPictograms = JSON.parse(cleanMatchJson);
    this.logger.log(`Matched Pictograms Result: ${JSON.stringify(matchedPictograms)}`);

    // Merge back into phrase
    for (const wordItem of enrichedData.phrase) {
      const match = matchedPictograms.find((m: any) => m.order === wordItem.order);
      wordItem.pictogram = match && match.pictogram ? match.pictogram : null;
    }

    const finalResult = {
      history,
      phrase: enrichedData.phrase,
      topic: enrichedData.topic,
      examples: enrichedData.examples,
    };
    
    this.logger.log(`Final Type 1 Payload: ${JSON.stringify(finalResult)}`);
    return finalResult;
  }
}

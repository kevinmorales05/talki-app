import { Injectable, Logger } from '@nestjs/common';
import { OpenaiService } from '../openai/openai.service.js';
import { PictogramsService } from '../pictograms/pictograms.service.js';

const TOPICS = [
  { id: '1', name: 'Morning Routine', emoji: '🌅' },
  { id: '2', name: 'Meal Time', emoji: '🍽️' },
  { id: '3', name: 'Going to School', emoji: '🏫' },
  { id: '4', name: 'Playing at the Park', emoji: '🏞️' },
  { id: '5', name: 'Bedtime', emoji: '🛌' },
  { id: '6', name: 'Emotions and Feelings', emoji: '😊' },
  { id: '7', name: 'Animals', emoji: '🐶' },
  { id: '8', name: 'Family Members', emoji: '👨‍👩‍👧‍👦' },
  { id: '9', name: 'Colors and Shapes', emoji: '🎨' },
  { id: '10', name: 'Toys and Games', emoji: '🧸' },
  { id: '11', name: 'Weather and Seasons', emoji: '☀️' },
  { id: '12', name: 'Body Parts', emoji: '👃' },
  { id: '13', name: 'Clothing', emoji: '👕' },
  { id: '14', name: 'Vehicles and Transport', emoji: '🚗' },
  { id: '15', name: 'Fruits and Vegetables', emoji: '🍎' },
  { id: '16', name: 'Action Verbs', emoji: '🏃‍♂️' },
  { id: '17', name: 'Polite Words (Please, Thank you)', emoji: '🙏' },
  { id: '18', name: 'Health and Hygiene', emoji: '🧼' },
  { id: '19', name: 'Household Items', emoji: '🛋️' },
  { id: '20', name: 'Places in the Community', emoji: '🏥' }
];

@Injectable()
export class GamesService {
  private readonly logger = new Logger(GamesService.name);

  constructor(
    private readonly openaiService: OpenaiService,
    private readonly pictogramsService: PictogramsService,
  ) {}

  getTopics() {
    return TOPICS;
  }

  async generatePracticeGames(topicInput?: string) {
    let topic = topicInput;
    if (!topic) {
      const randomIndex = Math.floor(Math.random() * TOPICS.length);
      topic = TOPICS[randomIndex].name;
    }

    this.logger.log(`Generating practice games for topic: ${topic}`);

    if (process.env.EMOJI === 'true') {
      this.logger.log(`EMOJI mode is enabled. Generating emoji practice games directly.`);
      const emojiGenPrompt = `You are a linguist assisting in creating pictogram practice games for kids using emojis. 
Create exactly 5 sentences related to the topic: "${topic}".
For each word in each sentence, provide an appropriate emoji representing that word. You MUST return actual Unicode emoji characters (e.g., "🧼", "🏠"), not text descriptions (like "soap").
Return ONLY valid JSON in the exact following structure without markdown blocks:
{
  "sentences": [
    {
      "sentenceText": "string",
      "phrase": [
        {
          "word": "string",
          "order": 0,
          "tags": [],
          "categories": [],
          "pictogram": { "id": -1, "url": null, "emoji": "actual_unicode_emoji_character" }
        }
      ]
    }
  ]
}
Return ONLY JSON. No other text.`;

      const emojiGenResponse = await this.openaiService.generateText(emojiGenPrompt);
      const cleanEmojiGenJson = emojiGenResponse.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const generatedEmojiData = JSON.parse(cleanEmojiGenJson);

      return {
        topic,
        practiceGames: generatedEmojiData.sentences
      };
    }

    const supercategories = await this.pictogramsService.getSupercategories();
    const supertags = await this.pictogramsService.getSupertags();

    const supercatData = supercategories.map((c) => ({ id: c._id, name: c.name, categories: c.categories }));
    const supertagData = supertags.map((t) => ({ id: t._id, name: t.name, tags: t.tags }));

    // Generate 5 sentences
    const generationPrompt = `You are a linguist assisting in creating pictogram practice games for kids. 
Create exactly 5 sentences related to the topic: "${topic}".
For each word in each sentence, identify the best matching tags and categories from the provided lists of Supercategories and Supertags.
Return ONLY valid JSON in the exact following structure without markdown blocks:
{
  "sentences": [
    {
      "sentenceText": "string",
      "phrase": [
        {
          "word": "string",
          "order": 0,
          "tags": [{ "id": "string", "name": "string" }],
          "categories": [{ "id": "string", "name": "string" }]
        }
      ]
    }
  ]
}

Available Supercategories (with nested categories to choose from):
${JSON.stringify(supercatData)}

Available Supertags (with nested tags to choose from):
${JSON.stringify(supertagData)}
`;

    const generationResponse = await this.openaiService.generateText(generationPrompt);
    const cleanGenJson = generationResponse.replace(/```json/gi, '').replace(/```/gi, '').trim();
    const generatedData = JSON.parse(cleanGenJson);

    // Collect all candidates
    const allCandidates = [];
    let wordIndexCounter = 0; // to uniquely identify words across all sentences for the match prompt

    for (const sentence of generatedData.sentences) {
      for (const wordItem of sentence.phrase) {
        wordItem.globalId = wordIndexCounter++;
        const categoryNames = wordItem.categories.map((c: any) => c.name);
        const tagNames = wordItem.tags.map((t: any) => t.name);

        const candidatePictograms = await this.pictogramsService.findPictogramCandidates(wordItem.word, categoryNames, tagNames);
        allCandidates.push({
          globalId: wordItem.globalId,
          word: wordItem.word,
          candidates: candidatePictograms.slice(0, 10).map((p: any) => ({ id: p.id, url: p.url, keywords: p.keywords })),
        });
      }
    }

    // Match prompt
    const matchPrompt = `You must pick the BEST pictogram for each word based on its candidates.
Return ONLY a valid JSON array of objects, where each object has "globalId" and "pictogram": { "id": number, "url": "string" }.
If no suitable candidates are provided for a word in the Candidates array, you MUST generate a fallback by providing an emoji representing the word, structured as { "id": -1, "url": null, "emoji": "fallback_emoji" }. Do NOT return null for pictogram.
Words and Candidates:
${JSON.stringify(allCandidates)}
Return ONLY JSON. No other text.`;

    const matchResponse = await this.openaiService.generateText(matchPrompt);
    const cleanMatchJson = matchResponse.replace(/```json/gi, '').replace(/```/gi, '').trim();
    const matchedPictograms = JSON.parse(cleanMatchJson);

    // Merge back
    for (const sentence of generatedData.sentences) {
      for (const wordItem of sentence.phrase) {
        const match = matchedPictograms.find((m: any) => m.globalId === wordItem.globalId);
        wordItem.pictogram = match && match.pictogram ? match.pictogram : null;
        delete wordItem.globalId; // clean up
      }
    }

    return {
      topic,
      practiceGames: generatedData.sentences
    };
  }
}

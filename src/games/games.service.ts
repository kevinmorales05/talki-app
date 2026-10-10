import { Injectable, Logger } from '@nestjs/common';
import { OpenaiService } from '../openai/openai.service.js';
import { PictogramsService } from '../pictograms/pictograms.service.js';

const TOPICS = [
  { id: '1', name: 'Morning Routine' },
  { id: '2', name: 'Meal Time' },
  { id: '3', name: 'Going to School' },
  { id: '4', name: 'Playing at the Park' },
  { id: '5', name: 'Bedtime' },
  { id: '6', name: 'Emotions and Feelings' },
  { id: '7', name: 'Animals' },
  { id: '8', name: 'Family Members' },
  { id: '9', name: 'Colors and Shapes' },
  { id: '10', name: 'Toys and Games' },
  { id: '11', name: 'Weather and Seasons' },
  { id: '12', name: 'Body Parts' },
  { id: '13', name: 'Clothing' },
  { id: '14', name: 'Vehicles and Transport' },
  { id: '15', name: 'Fruits and Vegetables' },
  { id: '16', name: 'Action Verbs' },
  { id: '17', name: 'Polite Words (Please, Thank you)' },
  { id: '18', name: 'Health and Hygiene' },
  { id: '19', name: 'Household Items' },
  { id: '20', name: 'Places in the Community' }
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

        const candidatePictograms = await this.pictogramsService.findPictogramsByTagsAndCategories(categoryNames, tagNames);
        allCandidates.push({
          globalId: wordItem.globalId,
          word: wordItem.word,
          candidates: candidatePictograms.slice(0, 10).map((p) => ({ id: p.id, url: p.url, keywords: p.keywords })),
        });
      }
    }

    // Match prompt
    const matchPrompt = `You must pick the BEST pictogram for each word based on its candidates.
Return ONLY a valid JSON array of objects, where each object has "globalId" and "pictogram": { "id": number, "url": "string" }.
If no suitable candidates are provided for a word, return null for its pictogram.
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

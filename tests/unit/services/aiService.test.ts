import { AIService } from '../../../src/services/aiService';
import { AnalysisType } from '../../../src/types';

describe('AIService', () => {
  let aiService: AIService;

  beforeAll(() => {
    aiService = AIService.getInstance();
  });

  describe('analyzeSentiment', () => {
    it('should analyze positive sentiment correctly', async () => {
      const text = 'I love this amazing product! It is wonderful and fantastic.';
      const result = await aiService.analyzeSentiment(text);

      expect(result.sentiment).toBe('positive');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.scores).toHaveProperty('positive');
      expect(result.scores).toHaveProperty('negative');
      expect(result.scores).toHaveProperty('neutral');
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should analyze negative sentiment correctly', async () => {
      const text = 'This is terrible and awful. I hate it so much.';
      const result = await aiService.analyzeSentiment(text);

      expect(result.sentiment).toBe('negative');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.scores.negative).toBeGreaterThan(0);
    });

    it('should analyze neutral sentiment correctly', async () => {
      const text = 'This is a regular product with standard features.';
      const result = await aiService.analyzeSentiment(text);

      expect(result.sentiment).toBe('neutral');
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('classifyText', () => {
    it('should classify technology text correctly', async () => {
      const text = 'Machine learning and AI are revolutionizing software development.';
      const result = await aiService.classifyText(text);

      expect(result.category).toBe('technology');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.allScores).toBeInstanceOf(Array);
    });

    it('should classify business text correctly', async () => {
      const text = 'Our revenue increased by 20% this quarter with strong customer growth.';
      const result = await aiService.classifyText(text);

      expect(result.category).toBe('business');
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('summarizeText', () => {
    it('should summarize text correctly', async () => {
      const text = 'This is the first sentence. This is the second sentence. This is the third sentence. This is the fourth sentence.';
      const result = await aiService.summarizeText(text);

      expect(result.summary).toBeTruthy();
      expect(result.originalLength).toBe(text.length);
      expect(result.summaryLength).toBeLessThan(result.originalLength);
      expect(result.compressionRatio).toBeTruthy();
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should respect maxTokens parameter', async () => {
      const text = 'This is a very long text that should be summarized with a token limit.';
      const result = await aiService.summarizeText(text, 50);

      expect(result.summary).toBeTruthy();
      expect(result.processingTime).toBeGreaterThan(0);
    });
  });

  describe('translateText', () => {
    it('should translate text to Spanish', async () => {
      const text = 'Hello world, good morning';
      const result = await aiService.translateText(text, 'es');

      expect(result.originalText).toBe(text);
      expect(result.translatedText).toContain('hola');
      expect(result.sourceLanguage).toBe('en');
      expect(result.targetLanguage).toBe('es');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should translate text to French', async () => {
      const text = 'Hello world';
      const result = await aiService.translateText(text, 'fr');

      expect(result.translatedText).toContain('bonjour');
      expect(result.targetLanguage).toBe('fr');
    });
  });

  describe('extractEntities', () => {
    it('should extract email entities', async () => {
      const text = 'Contact us at support@example.com for assistance.';
      const result = await aiService.extractEntities(text);

      expect(result.entities).toHaveLength(1);
      expect(result.entities[0].type).toBe('email');
      expect(result.entities[0].text).toBe('support@example.com');
      expect(result.totalEntities).toBe(1);
    });

    it('should extract multiple entity types', async () => {
      const text = 'Call 555-123-4567 or email test@example.com. Visit https://example.com for more info.';
      const result = await aiService.extractEntities(text);

      expect(result.entities.length).toBeGreaterThan(1);
      expect(result.totalEntities).toBeGreaterThan(1);
      
      const entityTypes = result.entities.map(e => e.type);
      expect(entityTypes).toContain('email');
      expect(entityTypes).toContain('url');
    });
  });

  describe('processAnalysis', () => {
    it('should process sentiment analysis request', async () => {
      const request = {
        text: 'This is a great product!',
        analysisType: AnalysisType.SENTIMENT,
        options: { confidence: 0.8 }
      };

      const result = await aiService.processAnalysis(request);

      expect(result.analysisType).toBe(AnalysisType.SENTIMENT);
      expect(result.result.confidence).toBeGreaterThan(0);
      expect(result.result.data).toBeTruthy();
      expect(result.result.processingTime).toBeGreaterThan(0);
      expect(result.metadata.model).toBe('demo-model-v1');
      expect(result.metadata.version).toBe('1.0.0');
      expect(result.metadata.tokensUsed).toBeGreaterThan(0);
    });

    it('should throw error for unsupported analysis type', async () => {
      const request = {
        text: 'Test text',
        analysisType: 'unsupported' as any,
        options: {}
      };

      await expect(aiService.processAnalysis(request)).rejects.toThrow('Unsupported analysis type');
    });
  });
});

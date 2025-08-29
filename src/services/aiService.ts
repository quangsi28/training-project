import { logger } from '@/config/logger';
import { 
  AIAnalysisRequest, 
  AIAnalysisResponse, 
  AnalysisType 
} from '@/types';

export class AIService {
  private static instance: AIService;

  private constructor() {
    // Constructor for singleton pattern
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async analyzeSentiment(text: string): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Mock sentiment analysis - in production, use actual AI service
      const words = text.toLowerCase().split(' ');
      const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'happy', 'joy'];
      const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'sad', 'angry', 'frustrated', 'disappointed'];
      
      let positiveScore = 0;
      let negativeScore = 0;
      
      words.forEach(word => {
        if (positiveWords.includes(word)) positiveScore++;
        if (negativeWords.includes(word)) negativeScore++;
      });
      
      const totalScore = positiveScore - negativeScore;
      let sentiment: string;
      let confidence: number;
      
      if (totalScore > 0) {
        sentiment = 'positive';
        confidence = Math.min(0.9, 0.5 + (totalScore * 0.1));
      } else if (totalScore < 0) {
        sentiment = 'negative';
        confidence = Math.min(0.9, 0.5 + (Math.abs(totalScore) * 0.1));
      } else {
        sentiment = 'neutral';
        confidence = 0.6;
      }

      return {
        sentiment,
        confidence,
        scores: {
          positive: positiveScore,
          negative: negativeScore,
          neutral: words.length - positiveScore - negativeScore
        },
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      logger.error('Sentiment analysis failed', { error, text: text.substring(0, 100) });
      throw error;
    }
  }

  async classifyText(text: string): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Mock text classification
      const categories = [
        { name: 'technology', keywords: ['ai', 'machine learning', 'software', 'computer', 'programming', 'code'] },
        { name: 'business', keywords: ['revenue', 'profit', 'market', 'sales', 'customer', 'strategy'] },
        { name: 'science', keywords: ['research', 'study', 'experiment', 'data', 'analysis', 'hypothesis'] },
        { name: 'entertainment', keywords: ['movie', 'music', 'game', 'fun', 'entertainment', 'show'] },
        { name: 'sports', keywords: ['game', 'team', 'player', 'score', 'match', 'competition'] }
      ];

      const textLower = text.toLowerCase();
      const categoryScores = categories.map(category => {
        const score = category.keywords.reduce((acc, keyword) => {
          return acc + (textLower.includes(keyword) ? 1 : 0);
        }, 0);
        return { category: category.name, score, confidence: Math.min(0.95, score * 0.2 + 0.1) };
      });

      const topCategory = categoryScores.reduce((prev, current) => 
        (prev.score > current.score) ? prev : current
      );

      return {
        category: topCategory.category,
        confidence: topCategory.confidence,
        allScores: categoryScores,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      logger.error('Text classification failed', { error, text: text.substring(0, 100) });
      throw error;
    }
  }

  async summarizeText(text: string, maxTokens = 100): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Mock text summarization
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const summaryLength = Math.min(3, Math.max(1, Math.floor(sentences.length * 0.3)));
      
      // Simple extractive summarization - pick first few sentences
      const summary = sentences.slice(0, summaryLength).join('. ') + '.';
      
      return {
        summary,
        originalLength: text.length,
        summaryLength: summary.length,
        compressionRatio: (summary.length / text.length).toFixed(2),
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      logger.error('Text summarization failed', { error, text: text.substring(0, 100) });
      throw error;
    }
  }

  async translateText(text: string, targetLanguage: string = 'es'): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Mock translation - in production, use actual translation service
      const translations: Record<string, Record<string, string>> = {
        'es': {
          'hello': 'hola',
          'world': 'mundo',
          'good': 'bueno',
          'morning': 'mañana',
          'thank you': 'gracias'
        },
        'fr': {
          'hello': 'bonjour',
          'world': 'monde',
          'good': 'bon',
          'morning': 'matin',
          'thank you': 'merci'
        }
      };

      let translatedText = text.toLowerCase();
      const langTranslations = translations[targetLanguage] || {};
      
      Object.entries(langTranslations).forEach(([english, translated]) => {
        translatedText = translatedText.replace(new RegExp(english, 'gi'), translated);
      });

      return {
        originalText: text,
        translatedText,
        sourceLanguage: 'en',
        targetLanguage,
        confidence: 0.85,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      logger.error('Translation failed', { error, text: text.substring(0, 100) });
      throw error;
    }
  }

  async extractEntities(text: string): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Mock entity extraction
      const entities: Array<{
        text: string;
        type: string;
        confidence: number;
        startIndex: number;
        endIndex: number;
      }> = [];
      
      // Simple regex patterns for common entities
      const patterns = {
        email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        phone: /\b\d{3}-\d{3}-\d{4}\b/g,
        date: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
        url: /https?:\/\/[^\s]+/g,
        money: /\$\d+(?:,\d{3})*(?:\.\d{2})?/g
      };

      Object.entries(patterns).forEach(([type, pattern]) => {
        const matches = text.match(pattern);
        if (matches) {
          matches.forEach(match => {
            entities.push({
              text: match,
              type,
              confidence: 0.9,
              startIndex: text.indexOf(match),
              endIndex: text.indexOf(match) + match.length
            });
          });
        }
      });

      return {
        entities,
        totalEntities: entities.length,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      logger.error('Entity extraction failed', { error, text: text.substring(0, 100) });
      throw error;
    }
  }

  async processAnalysis(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const startTime = Date.now();
    
    try {
      let result: any;
      
      switch (request.analysisType) {
        case AnalysisType.SENTIMENT:
          result = await this.analyzeSentiment(request.text);
          break;
        case AnalysisType.CLASSIFICATION:
          result = await this.classifyText(request.text);
          break;
        case AnalysisType.SUMMARIZATION:
          result = await this.summarizeText(request.text, request.options?.maxTokens);
          break;
        case AnalysisType.TRANSLATION:
          result = await this.translateText(request.text, request.options?.language);
          break;
        case AnalysisType.ENTITY_EXTRACTION:
          result = await this.extractEntities(request.text);
          break;
        default:
          throw new Error(`Unsupported analysis type: ${request.analysisType}`);
      }

      const processingTime = Date.now() - startTime;

      return {
        analysisType: request.analysisType,
        result: {
          confidence: result.confidence || 0.8,
          data: result,
          processingTime
        },
        metadata: {
          model: 'demo-model-v1',
          version: '1.0.0',
          tokensUsed: Math.floor(request.text.length / 4) // Rough token estimation
        }
      };
    } catch (error) {
      logger.error('AI analysis processing failed', { error, analysisType: request.analysisType });
      throw error;
    }
  }
}

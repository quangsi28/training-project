import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '@/config/logger';

export const validateRequest = (schema: {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    // Validate request body
    if (schema.body) {
      const { error } = schema.body.validate(req.body);
      if (error) {
        errors.push(`Body: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // Validate query parameters
    if (schema.query) {
      const { error } = schema.query.validate(req.query);
      if (error) {
        errors.push(`Query: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // Validate path parameters
    if (schema.params) {
      const { error } = schema.params.validate(req.params);
      if (error) {
        errors.push(`Params: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    if (errors.length > 0) {
      logger.warn('Request validation failed', { 
        url: req.url, 
        method: req.method, 
        errors 
      });
      
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();
  };
};

// Common validation schemas
export const schemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  }),

  aiAnalysis: Joi.object({
    text: Joi.string().required().min(1).max(10000),
    analysisType: Joi.string().valid(
      'sentiment',
      'classification', 
      'summarization',
      'translation',
      'entity_extraction'
    ).required(),
    options: Joi.object({
      language: Joi.string().length(2),
      confidence: Joi.number().min(0).max(1),
      maxTokens: Joi.number().integer().min(1).max(4000)
    }).optional()
  }),

  mlPrediction: Joi.object({
    features: Joi.array().items(Joi.number()).required().min(1),
    modelType: Joi.string().valid(
      'linear_regression',
      'classification',
      'clustering',
      'anomaly_detection'
    ).required(),
    options: Joi.object({
      threshold: Joi.number().min(0).max(1),
      returnProbabilities: Joi.boolean()
    }).optional()
  }),

  dataPoint: Joi.object({
    value: Joi.number().required(),
    category: Joi.string().required().min(1).max(100),
    metadata: Joi.object().optional()
  }),

  userRegistration: Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().required().min(2).max(100),
    password: Joi.string().required().min(8).max(128)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')),
    role: Joi.string().valid('USER', 'DEVELOPER', 'ADMIN').optional()
  }),

  userLogin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  idParam: Joi.object({
    id: Joi.string().required()
  })
};

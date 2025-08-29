import express from 'express';
import { prisma } from '@/config/database';
import { authenticateToken, AuthenticatedRequest } from '@/middleware/auth';
import { validateRequest, schemas } from '@/middleware/validation';
import { asyncHandler } from '@/middleware/errorHandler';
import { AIService } from '@/services/aiService';
import { logger } from '@/config/logger';
import { ApiResponse } from '@/types';

const router = express.Router();
const aiService = AIService.getInstance();

/**
 * @swagger
 * /api/ai/analyze:
 *   post:
 *     summary: Perform AI text analysis
 *     tags: [AI Analysis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - analysisType
 *             properties:
 *               text:
 *                 type: string
 *                 maxLength: 10000
 *               analysisType:
 *                 type: string
 *                 enum: [sentiment, classification, summarization, translation, entity_extraction]
 *               options:
 *                 type: object
 *                 properties:
 *                   language:
 *                     type: string
 *                   confidence:
 *                     type: number
 *                   maxTokens:
 *                     type: integer
 *     responses:
 *       200:
 *         description: Analysis completed successfully
 *       401:
 *         description: Authentication required
 */
router.post('/analyze',
  authenticateToken,
  validateRequest({ body: schemas.aiAnalysis }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { text, analysisType, options } = req.body;
    const userId = req.user!.id;

    // Process the analysis
    const analysisResult = await aiService.processAnalysis({
      text,
      analysisType,
      options
    });

    // Save to database
    const analysisRequest = await prisma.aIAnalysisRequest.create({
      data: {
        text,
        analysisType,
        language: options?.language,
        confidence: options?.confidence,
        maxTokens: options?.maxTokens,
        result: analysisResult.result,
        processingTime: analysisResult.result.processingTime,
        tokensUsed: analysisResult.metadata.tokensUsed,
        model: analysisResult.metadata.model,
        version: analysisResult.metadata.version,
        userId
      }
    });

    logger.info('AI analysis completed', {
      userId,
      analysisId: analysisRequest.id,
      analysisType,
      processingTime: analysisResult.result.processingTime
    });

    const response: ApiResponse = {
      success: true,
      data: {
        id: analysisRequest.id,
        ...analysisResult
      },
      message: 'Analysis completed successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  })
);

/**
 * @swagger
 * /api/ai/history:
 *   get:
 *     summary: Get user's AI analysis history
 *     tags: [AI Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: analysisType
 *         schema:
 *           type: string
 *         description: Filter by analysis type
 *     responses:
 *       200:
 *         description: Analysis history retrieved successfully
 */
router.get('/history',
  authenticateToken,
  validateRequest({ query: schemas.pagination }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const analysisType = req.query.analysisType as string;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(analysisType && { analysisType })
    };

    const [analyses, total] = await Promise.all([
      prisma.aIAnalysisRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          text: true,
          analysisType: true,
          result: true,
          processingTime: true,
          tokensUsed: true,
          model: true,
          createdAt: true
        }
      }),
      prisma.aIAnalysisRequest.count({ where })
    ]);

    const response: ApiResponse = {
      success: true,
      data: analyses,
      message: 'Analysis history retrieved successfully',
      timestamp: new Date().toISOString()
    };

    (response as any).pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    };

    res.json(response);
  })
);

/**
 * @swagger
 * /api/ai/batch-analyze:
 *   post:
 *     summary: Perform batch AI analysis on multiple texts
 *     tags: [AI Analysis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - requests
 *             properties:
 *               requests:
 *                 type: array
 *                 maxItems: 10
 *                 items:
 *                   type: object
 *                   required:
 *                     - text
 *                     - analysisType
 *                   properties:
 *                     text:
 *                       type: string
 *                     analysisType:
 *                       type: string
 *                     options:
 *                       type: object
 *     responses:
 *       200:
 *         description: Batch analysis completed successfully
 */
router.post('/batch-analyze',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { requests } = req.body;
    const userId = req.user!.id;

    if (!Array.isArray(requests) || requests.length === 0 || requests.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Requests must be an array with 1-10 items',
        timestamp: new Date().toISOString()
      });
    }

    const results = await Promise.all(
      requests.map(async (request: any, index: number) => {
        try {
          const analysisResult = await aiService.processAnalysis(request);
          
          // Save to database
          const analysisRequest = await prisma.aIAnalysisRequest.create({
            data: {
              text: request.text,
              analysisType: request.analysisType,
              language: request.options?.language,
              confidence: request.options?.confidence,
              maxTokens: request.options?.maxTokens,
              result: analysisResult.result,
              processingTime: analysisResult.result.processingTime,
              tokensUsed: analysisResult.metadata.tokensUsed,
              model: analysisResult.metadata.model,
              version: analysisResult.metadata.version,
              userId
            }
          });

          return {
            index,
            id: analysisRequest.id,
            success: true,
            ...analysisResult
          };
        } catch (error) {
          logger.error('Batch analysis item failed', { error, index, userId });
          return {
            index,
            success: false,
            error: 'Analysis failed'
          };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    
    logger.info('Batch AI analysis completed', {
      userId,
      totalRequests: requests.length,
      successCount,
      failureCount: requests.length - successCount
    });

    const response: ApiResponse = {
      success: true,
      data: {
        results,
        summary: {
          total: requests.length,
          successful: successCount,
          failed: requests.length - successCount
        }
      },
      message: 'Batch analysis completed',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  })
);

export default router;

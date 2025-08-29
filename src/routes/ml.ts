import express, { Response } from 'express';
import { prisma } from '@/config/database';
import { authenticateToken, AuthenticatedRequest } from '@/middleware/auth';
import { validateRequest, schemas } from '@/middleware/validation';
import { asyncHandler } from '@/middleware/errorHandler';
import { MLService } from '@/services/mlService';
import { logger } from '@/config/logger';
import { ApiResponse } from '@/types';

const router = express.Router();
const mlService = MLService.getInstance();

/**
 * @swagger
 * /api/ml/predict:
 *   post:
 *     summary: Make ML predictions
 *     tags: [Machine Learning]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - features
 *               - modelType
 *             properties:
 *               features:
 *                 type: array
 *                 items:
 *                   type: number
 *               modelType:
 *                 type: string
 *                 enum: [linear_regression, classification, clustering, anomaly_detection]
 *               options:
 *                 type: object
 *                 properties:
 *                   threshold:
 *                     type: number
 *                   returnProbabilities:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Prediction completed successfully
 */
router.post('/predict',
  authenticateToken,
  validateRequest({ body: schemas.mlPrediction }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { features, modelType, options } = req.body;
    const userId = req.user!.id;

    const predictionResult = await mlService.makePrediction({
      features,
      modelType,
      options
    });

    // Save to database
    const prediction = await prisma.mLPrediction.create({
      data: {
        features,
        modelType,
        threshold: options?.threshold || null,
        prediction: predictionResult.prediction,
        confidence: predictionResult.confidence,
        probabilities: predictionResult.probabilities ? JSON.parse(JSON.stringify(predictionResult.probabilities)) : null,
        modelVersion: predictionResult.modelInfo.version,
        accuracy: predictionResult.modelInfo.accuracy,
        userId
      }
    });

    logger.info('ML prediction completed', {
      userId,
      predictionId: prediction.id,
      modelType,
      confidence: predictionResult.confidence
    });

    const response: ApiResponse = {
      success: true,
      data: {
        id: prediction.id,
        ...predictionResult
      },
      message: 'Prediction completed successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  })
);

/**
 * @swagger
 * /api/ml/models/{modelType}/metrics:
 *   get:
 *     summary: Get model performance metrics
 *     tags: [Machine Learning]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: modelType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [linear_regression, classification, clustering, anomaly_detection]
 *     responses:
 *       200:
 *         description: Model metrics retrieved successfully
 */
router.get('/models/:modelType/metrics',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { modelType } = req.params;

    const validModelTypes = ['linear_regression', 'classification', 'clustering', 'anomaly_detection'];
    if (!modelType || !validModelTypes.includes(modelType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid model type',
        timestamp: new Date().toISOString()
      });
    }

    const metrics = await mlService.getModelMetrics(modelType as any);

    const response: ApiResponse = {
      success: true,
      data: metrics,
      message: 'Model metrics retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
    return;
  })
);

/**
 * @swagger
 * /api/ml/predictions/history:
 *   get:
 *     summary: Get user's ML prediction history
 *     tags: [Machine Learning]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: modelType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Prediction history retrieved successfully
 */
router.get('/predictions/history',
  authenticateToken,
  validateRequest({ query: schemas.pagination }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 10;
    const modelType = req.query['modelType'] as string;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      ...(modelType && { modelType })
    };

    const [predictions, total] = await Promise.all([
      prisma.mLPrediction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          features: true,
          modelType: true,
          prediction: true,
          confidence: true,
          probabilities: true,
          modelVersion: true,
          accuracy: true,
          createdAt: true
        }
      }),
      prisma.mLPrediction.count({ where })
    ]);

    const response: ApiResponse = {
      success: true,
      data: predictions,
      message: 'Prediction history retrieved successfully',
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
 * /api/ml/batch-predict:
 *   post:
 *     summary: Perform batch ML predictions
 *     tags: [Machine Learning]
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
 *                 maxItems: 20
 *                 items:
 *                   type: object
 *                   required:
 *                     - features
 *                     - modelType
 *                   properties:
 *                     features:
 *                       type: array
 *                       items:
 *                         type: number
 *                     modelType:
 *                       type: string
 *                     options:
 *                       type: object
 *     responses:
 *       200:
 *         description: Batch predictions completed successfully
 */
router.post('/batch-predict',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { requests } = req.body;
    const userId = req.user!.id;

    if (!Array.isArray(requests) || requests.length === 0 || requests.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Requests must be an array with 1-20 items',
        timestamp: new Date().toISOString()
      });
    }

    const results = await Promise.all(
      requests.map(async (request: any, index: number) => {
        try {
          const predictionResult = await mlService.makePrediction(request);
          
          const prediction = await prisma.mLPrediction.create({
            data: {
              features: request.features,
              modelType: request.modelType,
              threshold: request.options?.threshold || null,
              prediction: predictionResult.prediction,
              confidence: predictionResult.confidence,
              probabilities: predictionResult.probabilities ? JSON.parse(JSON.stringify(predictionResult.probabilities)) : null,
              modelVersion: predictionResult.modelInfo.version,
              accuracy: predictionResult.modelInfo.accuracy,
              userId
            }
          });

          return {
            index,
            id: prediction.id,
            success: true,
            ...predictionResult
          };
        } catch (error) {
          logger.error('Batch prediction item failed', { error, index, userId });
          return {
            index,
            success: false,
            error: 'Prediction failed'
          };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    
    logger.info('Batch ML predictions completed', {
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
      message: 'Batch predictions completed',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  })
);

export default router;

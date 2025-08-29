import express from 'express';
import { prisma } from '@/config/database';
import { authenticateToken, AuthenticatedRequest, requireRole } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/config/logger';
import { ApiResponse, UserRole, DatabaseMetrics } from '@/types';

const router = express.Router();

/**
 * @swagger
 * /api/metrics/system:
 *   get:
 *     summary: Get system performance metrics
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System metrics retrieved successfully
 */
router.get('/system',
  authenticateToken,
  requireRole([UserRole.ADMIN, UserRole.DEVELOPER]),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const startTime = Date.now();

    // Get database metrics
    const [
      userCount,
      analysisCount,
      predictionCount,
      dataPointCount,
      logCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.aIAnalysisRequest.count(),
      prisma.mLPrediction.count(),
      prisma.dataPoint.count(),
      prisma.logEntry.count()
    ]);

    // Mock system metrics (in production, these would come from actual monitoring)
    const systemMetrics = {
      database: {
        totalRecords: userCount + analysisCount + predictionCount + dataPointCount + logCount,
        tableStats: {
          users: userCount,
          ai_analysis_requests: analysisCount,
          ml_predictions: predictionCount,
          data_points: dataPointCount,
          log_entries: logCount
        },
        performanceMetrics: {
          avgQueryTime: Math.random() * 50 + 10, // Mock: 10-60ms
          slowQueries: Math.floor(Math.random() * 5),
          connectionPool: {
            active: Math.floor(Math.random() * 10) + 5,
            idle: Math.floor(Math.random() * 15) + 10,
            total: 25
          }
        }
      },
      server: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development'
      },
      api: {
        totalRequests: Math.floor(Math.random() * 10000) + 1000,
        averageResponseTime: Math.random() * 200 + 50,
        errorRate: Math.random() * 5, // 0-5%
        activeConnections: Math.floor(Math.random() * 100) + 20
      }
    };

    const queryTime = Date.now() - startTime;

    logger.info('System metrics retrieved', {
      userId: req.user!.id,
      queryTime,
      totalRecords: systemMetrics.database.totalRecords
    });

    const response: ApiResponse = {
      success: true,
      data: systemMetrics,
      message: 'System metrics retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  })
);

/**
 * @swagger
 * /api/metrics/usage:
 *   get:
 *     summary: Get API usage statistics
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *           default: day
 *     responses:
 *       200:
 *         description: Usage statistics retrieved successfully
 */
router.get('/usage',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const timeframe = req.query.timeframe as string || 'day';

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case 'hour':
        startDate.setHours(now.getHours() - 1);
        break;
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    const where = {
      userId,
      createdAt: {
        gte: startDate,
        lte: now
      }
    };

    const [
      analysisRequests,
      predictions,
      dataPoints
    ] = await Promise.all([
      prisma.aIAnalysisRequest.findMany({
        where,
        select: {
          analysisType: true,
          tokensUsed: true,
          processingTime: true,
          createdAt: true
        }
      }),
      prisma.mLPrediction.findMany({
        where,
        select: {
          modelType: true,
          confidence: true,
          createdAt: true
        }
      }),
      prisma.dataPoint.count({ where })
    ]);

    // Calculate usage statistics
    const usageStats = {
      timeframe,
      period: {
        start: startDate.toISOString(),
        end: now.toISOString()
      },
      aiAnalysis: {
        totalRequests: analysisRequests.length,
        totalTokensUsed: analysisRequests.reduce((sum, req) => sum + (req.tokensUsed || 0), 0),
        averageProcessingTime: analysisRequests.length > 0 
          ? analysisRequests.reduce((sum, req) => sum + (req.processingTime || 0), 0) / analysisRequests.length 
          : 0,
        byType: this.groupByField(analysisRequests, 'analysisType')
      },
      mlPredictions: {
        totalPredictions: predictions.length,
        averageConfidence: predictions.length > 0
          ? predictions.reduce((sum, pred) => sum + pred.confidence, 0) / predictions.length
          : 0,
        byModel: this.groupByField(predictions, 'modelType')
      },
      dataManagement: {
        dataPointsCreated: dataPoints
      }
    };

    const response: ApiResponse = {
      success: true,
      data: usageStats,
      message: 'Usage statistics retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  })
);

/**
 * @swagger
 * /api/metrics/performance:
 *   get:
 *     summary: Get performance analytics
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance metrics retrieved successfully
 */
router.get('/performance',
  authenticateToken,
  requireRole([UserRole.ADMIN, UserRole.DEVELOPER]),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Get recent analysis requests for performance metrics
    const recentAnalyses = await prisma.aIAnalysisRequest.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      select: {
        processingTime: true,
        tokensUsed: true,
        analysisType: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 1000
    });

    const recentPredictions = await prisma.mLPrediction.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      select: {
        confidence: true,
        modelType: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 1000
    });

    // Calculate performance metrics
    const processingTimes = recentAnalyses
      .filter(a => a.processingTime)
      .map(a => a.processingTime!);

    const confidenceScores = recentPredictions.map(p => p.confidence);

    const performanceMetrics = {
      aiAnalysis: {
        totalRequests: recentAnalyses.length,
        averageProcessingTime: processingTimes.length > 0 
          ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length 
          : 0,
        medianProcessingTime: this.calculateMedian(processingTimes),
        p95ProcessingTime: this.calculatePercentile(processingTimes, 95),
        fastestRequest: processingTimes.length > 0 ? Math.min(...processingTimes) : 0,
        slowestRequest: processingTimes.length > 0 ? Math.max(...processingTimes) : 0
      },
      mlPredictions: {
        totalPredictions: recentPredictions.length,
        averageConfidence: confidenceScores.length > 0
          ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
          : 0,
        medianConfidence: this.calculateMedian(confidenceScores),
        highConfidencePredictions: confidenceScores.filter(c => c > 0.8).length,
        lowConfidencePredictions: confidenceScores.filter(c => c < 0.5).length
      },
      trends: {
        requestsPerHour: this.calculateHourlyTrends(recentAnalyses),
        predictionsPerHour: this.calculateHourlyTrends(recentPredictions)
      }
    };

    const response: ApiResponse = {
      success: true,
      data: performanceMetrics,
      message: 'Performance metrics retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  })
);

// Helper methods
function groupByField(items: any[], field: string): Record<string, number> {
  return items.reduce((acc, item) => {
    const key = item[field];
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  return sorted.length % 2 !== 0 
    ? sorted[mid] 
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calculatePercentile(numbers: number[], percentile: number): number {
  if (numbers.length === 0) return 0;
  
  const sorted = [...numbers].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  
  return sorted[Math.max(0, index)];
}

function calculateHourlyTrends(items: any[]): number[] {
  const hourlyCount = new Array(24).fill(0);
  
  items.forEach(item => {
    const hour = new Date(item.createdAt).getHours();
    hourlyCount[hour]++;
  });
  
  return hourlyCount;
}

export default router;

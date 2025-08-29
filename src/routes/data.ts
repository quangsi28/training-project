import express from 'express';
import { prisma } from '@/config/database';
import { authenticateToken, AuthenticatedRequest } from '@/middleware/auth';
import { validateRequest, schemas } from '@/middleware/validation';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/config/logger';
import { ApiResponse } from '@/types';

const router = express.Router();

/**
 * @swagger
 * /api/data/points:
 *   post:
 *     summary: Create a new data point
 *     tags: [Data Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *               - category
 *             properties:
 *               value:
 *                 type: number
 *               category:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Data point created successfully
 */
router.post('/points',
  authenticateToken,
  validateRequest({ body: schemas.dataPoint }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { value, category, metadata } = req.body;
    const userId = req.user!.id;

    const dataPoint = await prisma.dataPoint.create({
      data: {
        value,
        category,
        metadata,
        userId
      }
    });

    logger.info('Data point created', {
      userId,
      dataPointId: dataPoint.id,
      category,
      value
    });

    const response: ApiResponse = {
      success: true,
      data: dataPoint,
      message: 'Data point created successfully',
      timestamp: new Date().toISOString()
    };

    res.status(201).json(response);
  })
);

/**
 * @swagger
 * /api/data/points:
 *   get:
 *     summary: Get user's data points
 *     tags: [Data Management]
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
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Data points retrieved successfully
 */
router.get('/points',
  authenticateToken,
  validateRequest({ query: schemas.pagination }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    
    if (category) {
      where.category = category;
    }
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const [dataPoints, total] = await Promise.all([
      prisma.dataPoint.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' }
      }),
      prisma.dataPoint.count({ where })
    ]);

    const response: ApiResponse = {
      success: true,
      data: dataPoints,
      message: 'Data points retrieved successfully',
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
 * /api/data/analytics:
 *   get:
 *     summary: Get data analytics and insights
 *     tags: [Data Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 */
router.get('/analytics',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const category = req.query.category as string;
    const timeframe = req.query.timeframe as string || 'month';

    // Calculate date range based on timeframe
    const now = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const where: any = {
      userId,
      timestamp: {
        gte: startDate,
        lte: now
      }
    };

    if (category) {
      where.category = category;
    }

    const [dataPoints, categoryStats] = await Promise.all([
      prisma.dataPoint.findMany({
        where,
        select: {
          value: true,
          category: true,
          timestamp: true
        }
      }),
      prisma.dataPoint.groupBy({
        by: ['category'],
        where: { userId },
        _count: { id: true },
        _avg: { value: true },
        _sum: { value: true },
        _min: { value: true },
        _max: { value: true }
      })
    ]);

    // Calculate basic statistics
    const values = dataPoints.map(dp => dp.value);
    const analytics = {
      totalPoints: dataPoints.length,
      timeframe,
      statistics: {
        mean: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
        min: values.length > 0 ? Math.min(...values) : 0,
        max: values.length > 0 ? Math.max(...values) : 0,
        sum: values.reduce((a, b) => a + b, 0)
      },
      categoryBreakdown: categoryStats.map(stat => ({
        category: stat.category,
        count: stat._count.id,
        average: stat._avg.value,
        sum: stat._sum.value,
        min: stat._min.value,
        max: stat._max.value
      })),
      trends: this.calculateTrends(dataPoints, timeframe)
    };

    const response: ApiResponse = {
      success: true,
      data: analytics,
      message: 'Analytics retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  })
);

/**
 * @swagger
 * /api/data/export:
 *   get:
 *     summary: Export data points as CSV
 *     tags: [Data Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, json]
 *           default: csv
 *     responses:
 *       200:
 *         description: Data exported successfully
 */
router.get('/export',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const category = req.query.category as string;
    const format = req.query.format as string || 'csv';

    const where: any = { userId };
    if (category) {
      where.category = category;
    }

    const dataPoints = await prisma.dataPoint.findMany({
      where,
      orderBy: { timestamp: 'desc' }
    });

    if (format === 'csv') {
      const csvHeader = 'id,timestamp,value,category,metadata\n';
      const csvRows = dataPoints.map(dp => 
        `${dp.id},${dp.timestamp.toISOString()},${dp.value},${dp.category},"${JSON.stringify(dp.metadata || {})}"`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=data-export-${Date.now()}.csv`);
      res.send(csvHeader + csvRows);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=data-export-${Date.now()}.json`);
      res.json({
        exportDate: new Date().toISOString(),
        totalRecords: dataPoints.length,
        data: dataPoints
      });
    }

    logger.info('Data exported', {
      userId,
      format,
      recordCount: dataPoints.length,
      category
    });
  })
);

// Helper method for trend calculation
function calculateTrends(dataPoints: any[], timeframe: string): any {
  if (dataPoints.length < 2) {
    return { trend: 'insufficient_data', change: 0 };
  }

  // Sort by timestamp
  const sorted = dataPoints.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  // Calculate simple trend
  const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
  const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, dp) => sum + dp.value, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, dp) => sum + dp.value, 0) / secondHalf.length;
  
  const change = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  let trend: string;
  if (Math.abs(change) < 5) {
    trend = 'stable';
  } else if (change > 0) {
    trend = 'increasing';
  } else {
    trend = 'decreasing';
  }

  return {
    trend,
    change: parseFloat(change.toFixed(2)),
    firstPeriodAvg: parseFloat(firstAvg.toFixed(2)),
    secondPeriodAvg: parseFloat(secondAvg.toFixed(2))
  };
}

export default router;

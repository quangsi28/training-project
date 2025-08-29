import express from 'express';
import { prisma } from '@/config/database';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/config/logger';
import { ApiResponse } from '@/types';

const router = express.Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Basic health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get('/',
  asyncHandler(async (req, res) => {
    const response: ApiResponse = {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
      },
      message: 'Service is healthy',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  })
);

/**
 * @swagger
 * /api/health/detailed:
 *   get:
 *     summary: Detailed health check including database connectivity
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Detailed health status
 *       503:
 *         description: Service unhealthy
 */
router.get('/detailed',
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    const checks = {
      database: { status: 'unknown', responseTime: 0, error: null },
      memory: { status: 'unknown', usage: null },
      disk: { status: 'unknown' },
      environment: { status: 'unknown', nodeVersion: process.version }
    };

    // Database connectivity check
    try {
      const dbStartTime = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      checks.database = {
        status: 'healthy',
        responseTime: Date.now() - dbStartTime,
        error: null
      };
    } catch (error) {
      checks.database = {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }

    // Memory usage check
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };

    checks.memory = {
      status: memUsageMB.heapUsed < 512 ? 'healthy' : 'warning', // Warning if > 512MB
      usage: memUsageMB
    };

    // Environment check
    checks.environment = {
      status: 'healthy',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      nodeEnv: process.env.NODE_ENV || 'development'
    };

    // Overall health determination
    const allHealthy = Object.values(checks).every(check => 
      check.status === 'healthy' || check.status === 'warning'
    );

    const overallStatus = allHealthy ? 'healthy' : 'unhealthy';
    const statusCode = allHealthy ? 200 : 503;

    const response: ApiResponse = {
      success: allHealthy,
      data: {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        checks,
        responseTime: Date.now() - startTime
      },
      message: `Service is ${overallStatus}`,
      timestamp: new Date().toISOString()
    };

    if (!allHealthy) {
      logger.warn('Health check failed', { checks });
    }

    res.status(statusCode).json(response);
  })
);

/**
 * @swagger
 * /api/health/ready:
 *   get:
 *     summary: Readiness probe for Kubernetes/Docker
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service not ready
 */
router.get('/ready',
  asyncHandler(async (req, res) => {
    try {
      // Check if database is accessible
      await prisma.$queryRaw`SELECT 1`;
      
      res.json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Readiness check failed', { error });
      res.status(503).json({
        status: 'not ready',
        error: 'Database connection failed',
        timestamp: new Date().toISOString()
      });
    }
  })
);

/**
 * @swagger
 * /api/health/live:
 *   get:
 *     summary: Liveness probe for Kubernetes/Docker
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 */
router.get('/live',
  asyncHandler(async (req, res) => {
    res.json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  })
);

export default router;

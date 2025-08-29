import { prisma } from '../src/config/database';

// Global test setup
beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();
});

afterAll(async () => {
  // Clean up and disconnect
  await prisma.$disconnect();
});

// Clean up database between tests
afterEach(async () => {
  // Clean up test data in reverse order of dependencies
  await prisma.aIAnalysisRequest.deleteMany();
  await prisma.mLPrediction.deleteMany();
  await prisma.dataPoint.deleteMany();
  await prisma.logEntry.deleteMany();
  await prisma.systemMetric.deleteMany();
  await prisma.user.deleteMany();
});

// Mock environment variables for tests
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/ai_training_demo_test';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  DEVELOPER = 'DEVELOPER'
}

export interface AIAnalysisRequest {
  text: string;
  analysisType: AnalysisType;
  options?: {
    language?: string;
    confidence?: number;
    maxTokens?: number;
  };
}

export enum AnalysisType {
  SENTIMENT = 'sentiment',
  CLASSIFICATION = 'classification',
  SUMMARIZATION = 'summarization',
  TRANSLATION = 'translation',
  ENTITY_EXTRACTION = 'entity_extraction'
}

export interface AIAnalysisResponse {
  analysisType: AnalysisType;
  result: {
    confidence: number;
    data: any;
    processingTime: number;
  };
  metadata: {
    model: string;
    version: string;
    tokensUsed: number;
  };
}

export interface DataPoint {
  id: string;
  timestamp: Date;
  value: number;
  category: string;
  metadata?: Record<string, any>;
}

export interface MLPredictionRequest {
  features: number[];
  modelType: ModelType;
  options?: {
    threshold?: number;
    returnProbabilities?: boolean;
  };
}

export enum ModelType {
  LINEAR_REGRESSION = 'linear_regression',
  CLASSIFICATION = 'classification',
  CLUSTERING = 'clustering',
  ANOMALY_DETECTION = 'anomaly_detection'
}

export interface MLPredictionResponse {
  prediction: number | string;
  confidence: number;
  probabilities?: Record<string, number>;
  modelInfo: {
    type: ModelType;
    version: string;
    accuracy: number;
  };
}

export interface DatabaseMetrics {
  totalRecords: number;
  tableStats: Record<string, number>;
  performanceMetrics: {
    avgQueryTime: number;
    slowQueries: number;
    connectionPool: {
      active: number;
      idle: number;
      total: number;
    };
  };
}

export interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  timestamp: Date;
  service: string;
  metadata?: Record<string, any>;
  traceId?: string;
}

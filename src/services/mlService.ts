import { logger } from '@/config/logger';
import { 
  MLPredictionRequest, 
  MLPredictionResponse, 
  ModelType 
} from '@/types';

export class MLService {
  private static instance: MLService;

  private constructor() {}

  public static getInstance(): MLService {
    if (!MLService.instance) {
      MLService.instance = new MLService();
    }
    return MLService.instance;
  }

  async linearRegression(features: number[]): Promise<any> {
    try {
      // Mock linear regression - simple weighted sum
      const weights = [0.5, -0.3, 0.8, 0.2, -0.1];
      const bias = 1.2;
      
      let prediction = bias;
      for (let i = 0; i < Math.min(features.length, weights.length); i++) {
        prediction += features[i]! * weights[i]!;
      }

      // Add some noise for realism
      const noise = (Math.random() - 0.5) * 0.1;
      prediction += noise;

      return {
        prediction: parseFloat(prediction.toFixed(3)),
        confidence: 0.85,
        modelInfo: {
          type: 'linear_regression',
          coefficients: weights.slice(0, features.length),
          bias,
          r_squared: 0.82
        }
      };
    } catch (error) {
      logger.error('Linear regression failed', { error, features });
      throw error;
    }
  }

  async classification(features: number[], returnProbabilities: boolean = false): Promise<any> {
    try {
      // Mock binary classification
      const weights = [0.7, -0.4, 0.6, -0.2, 0.3];
      const bias = 0.1;
      
      let score = bias;
      for (let i = 0; i < Math.min(features.length, weights.length); i++) {
        score += features[i]! * weights[i]!;
      }

      // Sigmoid activation
      const probability = 1 / (1 + Math.exp(-score));
      const prediction = probability > 0.5 ? 'positive' : 'negative';
      const confidence = Math.abs(probability - 0.5) * 2;

      const result: any = {
        prediction,
        confidence: parseFloat(confidence.toFixed(3)),
        modelInfo: {
          type: 'logistic_regression',
          threshold: 0.5,
          accuracy: 0.89
        }
      };

      if (returnProbabilities) {
        result.probabilities = {
          positive: parseFloat(probability.toFixed(3)),
          negative: parseFloat((1 - probability).toFixed(3))
        };
      }

      return result;
    } catch (error) {
      logger.error('Classification failed', { error, features });
      throw error;
    }
  }

  async clustering(features: number[]): Promise<any> {
    try {
      // Mock K-means clustering (3 clusters)
      const centroids = [
        [1.0, 2.0, 1.5],
        [-1.0, 0.5, -0.5],
        [2.5, -1.0, 3.0]
      ];

      let minDistance = Infinity;
      let assignedCluster = 0;

      centroids.forEach((centroid, index) => {
        let distance = 0;
        for (let i = 0; i < Math.min(features.length, centroid.length); i++) {
          distance += Math.pow(features[i]! - centroid[i]!, 2);
        }
        distance = Math.sqrt(distance);

        if (distance < minDistance) {
          minDistance = distance;
          assignedCluster = index;
        }
      });

      const confidence = Math.max(0.1, 1 - (minDistance / 10)); // Normalize distance to confidence

      return {
        prediction: `cluster_${assignedCluster}`,
        confidence: parseFloat(confidence.toFixed(3)),
        distance: parseFloat(minDistance.toFixed(3)),
        modelInfo: {
          type: 'kmeans',
          clusters: 3,
          centroids: centroids
        }
      };
    } catch (error) {
      logger.error('Clustering failed', { error, features });
      throw error;
    }
  }

  async anomalyDetection(features: number[], threshold: number = 0.5): Promise<any> {
    try {
      // Mock anomaly detection using isolation forest concept
      const normalRanges = [
        { min: -2, max: 2 },
        { min: -1, max: 3 },
        { min: 0, max: 4 },
        { min: -3, max: 1 },
        { min: -1, max: 2 }
      ];

      let anomalyScore = 0;
      let outOfRangeCount = 0;

      features.forEach((feature, index) => {
        if (index < normalRanges.length) {
          const range = normalRanges[index]!;
          if (feature < range.min || feature > range.max) {
            outOfRangeCount++;
            const deviation = Math.min(
              Math.abs(feature - range.min),
              Math.abs(feature - range.max)
            );
            anomalyScore += deviation;
          }
        }
      });

      // Normalize anomaly score
      anomalyScore = Math.min(1, anomalyScore / (features.length * 2));
      const isAnomaly = anomalyScore > threshold;
      const confidence = Math.abs(anomalyScore - threshold) + 0.1;

      return {
        prediction: isAnomaly ? 'anomaly' : 'normal',
        confidence: parseFloat(Math.min(confidence, 1).toFixed(3)),
        anomalyScore: parseFloat(anomalyScore.toFixed(3)),
        outOfRangeFeatures: outOfRangeCount,
        modelInfo: {
          type: 'isolation_forest',
          threshold,
          normalRanges: normalRanges.slice(0, features.length)
        }
      };
    } catch (error) {
      logger.error('Anomaly detection failed', { error, features });
      throw error;
    }
  }

  async makePrediction(request: MLPredictionRequest): Promise<MLPredictionResponse> {
    try {
      let result: any;
      
      switch (request.modelType) {
        case ModelType.LINEAR_REGRESSION:
          result = await this.linearRegression(request.features);
          break;
        case ModelType.CLASSIFICATION:
          result = await this.classification(
            request.features, 
            request.options?.returnProbabilities
          );
          break;
        case ModelType.CLUSTERING:
          result = await this.clustering(request.features);
          break;
        case ModelType.ANOMALY_DETECTION:
          result = await this.anomalyDetection(
            request.features, 
            request.options?.threshold
          );
          break;
        default:
          throw new Error(`Unsupported model type: ${request.modelType}`);
      }

      return {
        prediction: result.prediction,
        confidence: result.confidence,
        probabilities: result.probabilities,
        modelInfo: {
          type: request.modelType,
          version: '1.0.0',
          accuracy: result.modelInfo?.accuracy || 0.85
        }
      };
    } catch (error) {
      logger.error('ML prediction failed', { error, modelType: request.modelType });
      throw error;
    }
  }

  async getModelMetrics(modelType: ModelType): Promise<any> {
    try {
      // Mock model performance metrics
      const baseMetrics = {
        [ModelType.LINEAR_REGRESSION]: {
          mse: 0.15,
          rmse: 0.39,
          mae: 0.28,
          r_squared: 0.82
        },
        [ModelType.CLASSIFICATION]: {
          accuracy: 0.89,
          precision: 0.87,
          recall: 0.91,
          f1_score: 0.89,
          auc_roc: 0.94
        },
        [ModelType.CLUSTERING]: {
          silhouette_score: 0.73,
          inertia: 145.6,
          calinski_harabasz: 89.2,
          davies_bouldin: 0.68
        },
        [ModelType.ANOMALY_DETECTION]: {
          precision: 0.76,
          recall: 0.82,
          f1_score: 0.79,
          false_positive_rate: 0.05
        }
      };

      return {
        modelType,
        version: '1.0.0',
        trainingDate: '2024-01-15',
        metrics: baseMetrics[modelType] || {},
        datasetSize: 10000,
        features: ['feature_1', 'feature_2', 'feature_3', 'feature_4', 'feature_5']
      };
    } catch (error) {
      logger.error('Failed to get model metrics', { error, modelType });
      throw error;
    }
  }
}

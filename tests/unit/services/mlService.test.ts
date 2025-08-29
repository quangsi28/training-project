import { MLService } from '../../../src/services/mlService';
import { ModelType } from '../../../src/types';

describe('MLService', () => {
  let mlService: MLService;

  beforeAll(() => {
    mlService = MLService.getInstance();
  });

  describe('linearRegression', () => {
    it('should make linear regression prediction', async () => {
      const features = [1.0, 2.0, 3.0, 4.0, 5.0];
      const result = await mlService.linearRegression(features);

      expect(typeof result.prediction).toBe('number');
      expect(result.confidence).toBe(0.85);
      expect(result.modelInfo.type).toBe('linear_regression');
      expect(result.modelInfo.coefficients).toHaveLength(features.length);
      expect(result.modelInfo.bias).toBeDefined();
      expect(result.modelInfo.r_squared).toBe(0.82);
    });

    it('should handle fewer features than weights', async () => {
      const features = [1.0, 2.0];
      const result = await mlService.linearRegression(features);

      expect(typeof result.prediction).toBe('number');
      expect(result.modelInfo.coefficients).toHaveLength(features.length);
    });
  });

  describe('classification', () => {
    it('should make binary classification prediction', async () => {
      const features = [1.0, 2.0, 3.0];
      const result = await mlService.classification(features);

      expect(['positive', 'negative']).toContain(result.prediction);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.modelInfo.type).toBe('logistic_regression');
      expect(result.modelInfo.threshold).toBe(0.5);
      expect(result.modelInfo.accuracy).toBe(0.89);
    });

    it('should return probabilities when requested', async () => {
      const features = [1.0, 2.0, 3.0];
      const result = await mlService.classification(features, true);

      expect(result.probabilities).toBeDefined();
      expect(result.probabilities.positive).toBeGreaterThan(0);
      expect(result.probabilities.negative).toBeGreaterThan(0);
      expect(result.probabilities.positive + result.probabilities.negative).toBeCloseTo(1, 2);
    });
  });

  describe('clustering', () => {
    it('should assign data point to a cluster', async () => {
      const features = [1.0, 2.0, 1.5];
      const result = await mlService.clustering(features);

      expect(result.prediction).toMatch(/^cluster_\d$/);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.distance).toBeGreaterThan(0);
      expect(result.modelInfo.type).toBe('kmeans');
      expect(result.modelInfo.clusters).toBe(3);
      expect(result.modelInfo.centroids).toHaveLength(3);
    });
  });

  describe('anomalyDetection', () => {
    it('should detect normal data points', async () => {
      const features = [1.0, 2.0, 3.0]; // Within normal ranges
      const result = await mlService.anomalyDetection(features);

      expect(['anomaly', 'normal']).toContain(result.prediction);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.anomalyScore).toBeGreaterThanOrEqual(0);
      expect(result.anomalyScore).toBeLessThanOrEqual(1);
      expect(result.outOfRangeFeatures).toBeGreaterThanOrEqual(0);
      expect(result.modelInfo.type).toBe('isolation_forest');
    });

    it('should use custom threshold', async () => {
      const features = [10.0, 20.0, 30.0]; // Likely anomalous
      const threshold = 0.3;
      const result = await mlService.anomalyDetection(features, threshold);

      expect(result.modelInfo.threshold).toBe(threshold);
      expect(result.outOfRangeFeatures).toBeGreaterThan(0);
    });
  });

  describe('makePrediction', () => {
    it('should make linear regression prediction', async () => {
      const request = {
        features: [1.0, 2.0, 3.0],
        modelType: ModelType.LINEAR_REGRESSION,
        options: {}
      };

      const result = await mlService.makePrediction(request);

      expect(typeof result.prediction).toBe('number');
      expect(result.confidence).toBeDefined();
      expect(result.modelInfo.type).toBe(ModelType.LINEAR_REGRESSION);
      expect(result.modelInfo.version).toBe('1.0.0');
      expect(result.modelInfo.accuracy).toBeDefined();
    });

    it('should make classification prediction with probabilities', async () => {
      const request = {
        features: [1.0, 2.0, 3.0],
        modelType: ModelType.CLASSIFICATION,
        options: { returnProbabilities: true }
      };

      const result = await mlService.makePrediction(request);

      expect(['positive', 'negative']).toContain(result.prediction);
      expect(result.probabilities).toBeDefined();
      expect(result.modelInfo.type).toBe(ModelType.CLASSIFICATION);
    });

    it('should make clustering prediction', async () => {
      const request = {
        features: [1.0, 2.0, 3.0],
        modelType: ModelType.CLUSTERING,
        options: {}
      };

      const result = await mlService.makePrediction(request);

      expect(result.prediction).toMatch(/^cluster_\d$/);
      expect(result.modelInfo.type).toBe(ModelType.CLUSTERING);
    });

    it('should make anomaly detection prediction', async () => {
      const request = {
        features: [1.0, 2.0, 3.0],
        modelType: ModelType.ANOMALY_DETECTION,
        options: { threshold: 0.5 }
      };

      const result = await mlService.makePrediction(request);

      expect(['anomaly', 'normal']).toContain(result.prediction);
      expect(result.modelInfo.type).toBe(ModelType.ANOMALY_DETECTION);
    });

    it('should throw error for unsupported model type', async () => {
      const request = {
        features: [1.0, 2.0, 3.0],
        modelType: 'unsupported' as any,
        options: {}
      };

      await expect(mlService.makePrediction(request)).rejects.toThrow('Unsupported model type');
    });
  });

  describe('getModelMetrics', () => {
    it('should return metrics for linear regression', async () => {
      const metrics = await mlService.getModelMetrics(ModelType.LINEAR_REGRESSION);

      expect(metrics.modelType).toBe(ModelType.LINEAR_REGRESSION);
      expect(metrics.version).toBe('1.0.0');
      expect(metrics.trainingDate).toBeDefined();
      expect(metrics.metrics.mse).toBeDefined();
      expect(metrics.metrics.rmse).toBeDefined();
      expect(metrics.metrics.mae).toBeDefined();
      expect(metrics.metrics.r_squared).toBeDefined();
      expect(metrics.datasetSize).toBe(10000);
      expect(metrics.features).toBeInstanceOf(Array);
    });

    it('should return metrics for classification', async () => {
      const metrics = await mlService.getModelMetrics(ModelType.CLASSIFICATION);

      expect(metrics.modelType).toBe(ModelType.CLASSIFICATION);
      expect(metrics.metrics.accuracy).toBeDefined();
      expect(metrics.metrics.precision).toBeDefined();
      expect(metrics.metrics.recall).toBeDefined();
      expect(metrics.metrics.f1_score).toBeDefined();
      expect(metrics.metrics.auc_roc).toBeDefined();
    });

    it('should return metrics for clustering', async () => {
      const metrics = await mlService.getModelMetrics(ModelType.CLUSTERING);

      expect(metrics.modelType).toBe(ModelType.CLUSTERING);
      expect(metrics.metrics.silhouette_score).toBeDefined();
      expect(metrics.metrics.inertia).toBeDefined();
      expect(metrics.metrics.calinski_harabasz).toBeDefined();
      expect(metrics.metrics.davies_bouldin).toBeDefined();
    });

    it('should return metrics for anomaly detection', async () => {
      const metrics = await mlService.getModelMetrics(ModelType.ANOMALY_DETECTION);

      expect(metrics.modelType).toBe(ModelType.ANOMALY_DETECTION);
      expect(metrics.metrics.precision).toBeDefined();
      expect(metrics.metrics.recall).toBeDefined();
      expect(metrics.metrics.f1_score).toBeDefined();
      expect(metrics.metrics.false_positive_rate).toBeDefined();
    });
  });
});

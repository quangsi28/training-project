// Helper functions for the application

export const safeJsonParse = (value: any): any => {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
};

export const getEnvVar = (key: string, defaultValue = ''): string => {
  return process.env[key] || defaultValue;
};

export const groupByField = (items: any[], field: string): Record<string, number> => {
  return items.reduce((acc, item) => {
    const key = item[field];
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
};

export const calculateMedian = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  return sorted.length % 2 !== 0 
    ? sorted[mid] 
    : (sorted[mid - 1] + sorted[mid]) / 2;
};

export const calculatePercentile = (numbers: number[], percentile: number): number => {
  if (numbers.length === 0) return 0;
  
  const sorted = [...numbers].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  
  return sorted[Math.max(0, index)];
};

export const calculateHourlyTrends = (items: any[]): number[] => {
  const hourlyCount = new Array(24).fill(0);
  
  items.forEach(item => {
    const hour = new Date(item.createdAt).getHours();
    hourlyCount[hour]++;
  });
  
  return hourlyCount;
};

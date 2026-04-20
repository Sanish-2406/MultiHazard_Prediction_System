/**
 * Training Service — Simulates a complete ML pipeline:
 * Data Generation → Preprocessing → Training → Evaluation
 *
 * Uses a synthetic NASA-style multi-hazard dataset.
 */

/* ──────── Random Helpers ──────── */
function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function gaussian(mean, std) {
  const u = 1 - Math.random();
  const v = Math.random();
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* ──────── Generate Synthetic NASA Multi-Hazard Dataset ──────── */
export function generateNASADataset(numSamples = 2000) {
  const features = [
    'rainfall_mm', 'temperature_c', 'humidity_pct', 'pressure_hpa',
    'wind_speed_ms', 'soil_moisture_pct', 'elevation_m', 'slope_deg',
    'vegetation_index', 'drainage_density', 'distance_to_river_km',
    'antecedent_rainfall_mm',
  ];

  const data = [];

  for (let i = 0; i < numSamples; i++) {
    // Generate correlated features
    const rainfall = Math.max(0, gaussian(45, 40));
    const temperature = gaussian(28, 8);
    const humidity = Math.min(100, Math.max(20, gaussian(70, 15)));
    const pressure = gaussian(1010, 10);
    const windSpeed = Math.max(0, gaussian(8, 5));
    const soilMoisture = Math.min(100, Math.max(5, gaussian(50, 20)));
    const elevation = Math.max(0, gaussian(400, 300));
    const slope = Math.max(0, Math.min(60, gaussian(15, 12)));
    const vegIndex = Math.min(1, Math.max(0, gaussian(0.5, 0.2)));
    const drainageDensity = Math.max(0, gaussian(3, 1.5));
    const distRiver = Math.max(0.1, gaussian(5, 4));
    const antecedentRainfall = Math.max(0, gaussian(80, 60));

    // Compute risk score (deterministic with noise)
    let riskScore = 0;
    riskScore += rainfall > 80 ? 3 : rainfall > 40 ? 2 : rainfall > 15 ? 1 : 0;
    riskScore += humidity > 85 ? 2 : humidity > 70 ? 1 : 0;
    riskScore += slope > 30 ? 2 : slope > 15 ? 1 : 0;
    riskScore += soilMoisture > 70 ? 2 : soilMoisture > 50 ? 1 : 0;
    riskScore += antecedentRainfall > 120 ? 2 : antecedentRainfall > 60 ? 1 : 0;
    riskScore += distRiver < 2 ? 1 : 0;
    riskScore += pressure < 1005 ? 1 : 0;

    // Add noise
    riskScore += gaussian(0, 1);

    let riskClass;
    if (riskScore >= 8) riskClass = 'High';
    else if (riskScore >= 4) riskClass = 'Medium';
    else riskClass = 'Low';

    data.push({
      rainfall_mm: +rainfall.toFixed(1),
      temperature_c: +temperature.toFixed(1),
      humidity_pct: +humidity.toFixed(1),
      pressure_hpa: +pressure.toFixed(1),
      wind_speed_ms: +windSpeed.toFixed(1),
      soil_moisture_pct: +soilMoisture.toFixed(1),
      elevation_m: +elevation.toFixed(0),
      slope_deg: +slope.toFixed(1),
      vegetation_index: +vegIndex.toFixed(3),
      drainage_density: +drainageDensity.toFixed(2),
      distance_to_river_km: +distRiver.toFixed(2),
      antecedent_rainfall_mm: +antecedentRainfall.toFixed(1),
      risk_class: riskClass,
    });
  }

  return { features, data };
}

/* ──────── Data Summary ──────── */
export function computeDataSummary(data) {
  const total = data.length;
  const classCounts = { Low: 0, Medium: 0, High: 0 };
  data.forEach((d) => { classCounts[d.risk_class]++; });

  return {
    totalSamples: total,
    featureCount: 12,
    classDistribution: classCounts,
    classPercentages: {
      Low: ((classCounts.Low / total) * 100).toFixed(1),
      Medium: ((classCounts.Medium / total) * 100).toFixed(1),
      High: ((classCounts.High / total) * 100).toFixed(1),
    },
  };
}

/* ──────── Feature Statistics ──────── */
export function computeFeatureStats(data, feature) {
  const values = data.map((d) => d[feature]).filter((v) => v != null);
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[n - 1];
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);

  return { mean: +mean.toFixed(2), median: +median.toFixed(2), min: +min.toFixed(2), max: +max.toFixed(2), std: +std.toFixed(2) };
}

/* ──────── Rainfall vs Risk Distribution ──────── */
export function computeRainfallVsRisk(data) {
  const bins = [
    { label: '0–20mm', min: 0, max: 20 },
    { label: '20–40mm', min: 20, max: 40 },
    { label: '40–60mm', min: 40, max: 60 },
    { label: '60–80mm', min: 60, max: 80 },
    { label: '80–100mm', min: 80, max: 100 },
    { label: '100+mm', min: 100, max: 9999 },
  ];

  return bins.map((bin) => {
    const inBin = data.filter((d) => d.rainfall_mm >= bin.min && d.rainfall_mm < bin.max);
    return {
      label: bin.label,
      Low: inBin.filter((d) => d.risk_class === 'Low').length,
      Medium: inBin.filter((d) => d.risk_class === 'Medium').length,
      High: inBin.filter((d) => d.risk_class === 'High').length,
    };
  });
}

/* ──────── Simulate Model Training ──────── */
function simulateModelMetrics(modelName) {
  // Simulate realistic metrics with slight randomness
  const base = modelName === 'Random Forest'
    ? { acc: 0.89, prec: 0.88, rec: 0.87, f1: 0.875 }
    : { acc: 0.78, prec: 0.76, rec: 0.75, f1: 0.755 };

  const jitter = () => (Math.random() - 0.5) * 0.04;

  return {
    accuracy: Math.min(0.99, Math.max(0.6, +(base.acc + jitter()).toFixed(4))),
    precision: Math.min(0.99, Math.max(0.6, +(base.prec + jitter()).toFixed(4))),
    recall: Math.min(0.99, Math.max(0.6, +(base.rec + jitter()).toFixed(4))),
    f1Score: Math.min(0.99, Math.max(0.6, +(base.f1 + jitter()).toFixed(4))),
  };
}

/* ──────── Feature Importance (Random Forest) ──────── */
function computeFeatureImportance() {
  const features = {
    'rainfall_mm': 0.22,
    'antecedent_rainfall_mm': 0.15,
    'soil_moisture_pct': 0.14,
    'slope_deg': 0.12,
    'humidity_pct': 0.10,
    'distance_to_river_km': 0.07,
    'pressure_hpa': 0.05,
    'elevation_m': 0.04,
    'wind_speed_ms': 0.04,
    'drainage_density': 0.03,
    'vegetation_index': 0.02,
    'temperature_c': 0.02,
  };

  // Add small jitter
  const result = {};
  let total = 0;
  for (const [k, v] of Object.entries(features)) {
    const val = Math.max(0.005, v + (Math.random() - 0.5) * 0.03);
    result[k] = val;
    total += val;
  }
  // Normalize to sum to 1
  for (const k of Object.keys(result)) {
    result[k] = +(result[k] / total).toFixed(4);
  }
  return result;
}

/* ──────── Confusion Matrix ──────── */
function generateConfusionMatrix(data, accuracy) {
  const classes = ['Low', 'Medium', 'High'];
  const counts = { Low: 0, Medium: 0, High: 0 };
  data.forEach((d) => counts[d.risk_class]++);

  // Generate realistic confusion matrix
  const matrix = classes.map((actual) => {
    return classes.map((predicted) => {
      if (actual === predicted) {
        // Correct predictions based on accuracy
        return Math.floor(counts[actual] * (accuracy - 0.02 + Math.random() * 0.04));
      } else {
        // Misclassifications
        const errorRate = (1 - accuracy) / 2;
        return Math.floor(counts[actual] * (errorRate + (Math.random() - 0.5) * 0.02));
      }
    });
  });

  return { classes, matrix };
}

/* ──────── Training Epoch History ──────── */
function generateTrainingHistory(epochs = 20, modelName = 'Random Forest') {
  const baseAcc = modelName === 'Random Forest' ? 0.89 : 0.78;
  const history = [];

  for (let i = 1; i <= epochs; i++) {
    const progress = i / epochs;
    const acc = Math.min(baseAcc + 0.02, 0.5 + (baseAcc - 0.5) * (1 - Math.exp(-3 * progress)) + (Math.random() - 0.5) * 0.02);
    const loss = Math.max(0.05, 1.2 * Math.exp(-3 * progress) + (Math.random() - 0.5) * 0.05);
    history.push({
      epoch: i,
      accuracy: +acc.toFixed(4),
      loss: +loss.toFixed(4),
    });
  }

  return history;
}

/* ──────── Main Training Pipeline ──────── */
export async function runTrainingPipeline(onProgress) {
  const steps = [
    { label: 'Generating NASA multi-hazard dataset...', duration: 800 },
    { label: 'Preprocessing data (normalization, encoding)...', duration: 600 },
    { label: 'Feature engineering (12 features extracted)...', duration: 500 },
    { label: 'Splitting dataset (80% train / 20% test)...', duration: 400 },
    { label: 'Training Random Forest model...', duration: 1500 },
    { label: 'Evaluating Random Forest...', duration: 600 },
    { label: 'Training Logistic Regression model...', duration: 1000 },
    { label: 'Evaluating Logistic Regression...', duration: 500 },
    { label: 'Computing feature importance...', duration: 400 },
    { label: 'Generating confusion matrices...', duration: 300 },
    { label: 'Finalizing results...', duration: 300 },
  ];

  // Run steps with progress callbacks
  for (let i = 0; i < steps.length; i++) {
    onProgress({
      step: i + 1,
      totalSteps: steps.length,
      label: steps[i].label,
      percent: Math.round(((i + 1) / steps.length) * 100),
    });
    await new Promise((r) => setTimeout(r, steps[i].duration));
  }

  // Generate all data
  const { features, data } = generateNASADataset(2000);
  const summary = computeDataSummary(data);
  const rainfallVsRisk = computeRainfallVsRisk(data);

  const rfMetrics = simulateModelMetrics('Random Forest');
  const lrMetrics = simulateModelMetrics('Logistic Regression');

  const featureImportance = computeFeatureImportance();
  const rfConfusion = generateConfusionMatrix(data, rfMetrics.accuracy);
  const lrConfusion = generateConfusionMatrix(data, lrMetrics.accuracy);

  const rfHistory = generateTrainingHistory(20, 'Random Forest');
  const lrHistory = generateTrainingHistory(20, 'Logistic Regression');

  const featureStats = {};
  features.forEach((f) => {
    featureStats[f] = computeFeatureStats(data, f);
  });

  return {
    dataset: { features, sampleData: data.slice(0, 50) },
    summary,
    rainfallVsRisk,
    models: {
      randomForest: {
        name: 'Random Forest',
        metrics: rfMetrics,
        confusion: rfConfusion,
        history: rfHistory,
      },
      logisticRegression: {
        name: 'Logistic Regression',
        metrics: lrMetrics,
        confusion: lrConfusion,
        history: lrHistory,
      },
    },
    featureImportance,
    featureStats,
    trainedAt: new Date().toISOString(),
  };
}

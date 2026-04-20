import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import ConfusionMatrix from '../components/ConfusionMatrix';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  ArcElement, Title, Tooltip, Legend, Filler,
);

const chartDefaults = {
  color: '#94a3b8',
  borderColor: 'rgba(148, 163, 184, 0.1)',
  font: { family: 'Inter, sans-serif' },
};

export default function ResultsPage({ trainingResults }) {
  if (!trainingResults) {
    return (
      <div className="results-page" id="results-page">
        <div className="card">
          <div className="placeholder-state" style={{ padding: 'var(--space-3xl)' }}>
            <div className="placeholder-icon">ℹ️</div>
            <h3 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
              No Training Results Yet
            </h3>
            <p>Go to the <strong>Training</strong> page and train a model first.</p>
          </div>
        </div>
      </div>
    );
  }

  const { summary, rainfallVsRisk, models, featureImportance, featureStats } = trainingResults;
  const rf = models.randomForest;
  const lr = models.logisticRegression;

  /* ──────── Chart Data ──────── */

  // 1. Class Distribution Doughnut
  const classDistData = {
    labels: ['Low', 'Medium', 'High'],
    datasets: [{
      data: [summary.classDistribution.Low, summary.classDistribution.Medium, summary.classDistribution.High],
      backgroundColor: ['rgba(34, 197, 94, 0.7)', 'rgba(245, 158, 11, 0.7)', 'rgba(239, 68, 68, 0.7)'],
      borderColor: ['#22c55e', '#f59e0b', '#ef4444'],
      borderWidth: 2,
    }],
  };

  // 2. Rainfall vs Risk (stacked bar)
  const rainfallChartData = {
    labels: rainfallVsRisk.map((r) => r.label),
    datasets: [
      {
        label: 'Low Risk',
        data: rainfallVsRisk.map((r) => r.Low),
        backgroundColor: 'rgba(34, 197, 94, 0.65)',
        borderColor: '#22c55e',
        borderWidth: 1,
      },
      {
        label: 'Medium Risk',
        data: rainfallVsRisk.map((r) => r.Medium),
        backgroundColor: 'rgba(245, 158, 11, 0.65)',
        borderColor: '#f59e0b',
        borderWidth: 1,
      },
      {
        label: 'High Risk',
        data: rainfallVsRisk.map((r) => r.High),
        backgroundColor: 'rgba(239, 68, 68, 0.65)',
        borderColor: '#ef4444',
        borderWidth: 1,
      },
    ],
  };

  // 3. Feature Importance (horizontal bar)
  const sortedFeatures = Object.entries(featureImportance).sort((a, b) => b[1] - a[1]);
  const featureChartData = {
    labels: sortedFeatures.map(([k]) => k.replace(/_/g, ' ')),
    datasets: [{
      label: 'Importance',
      data: sortedFeatures.map(([, v]) => +(v * 100).toFixed(1)),
      backgroundColor: sortedFeatures.map(([, v]) => {
        if (v >= 0.15) return 'rgba(99, 102, 241, 0.7)';
        if (v >= 0.08) return 'rgba(59, 130, 246, 0.6)';
        return 'rgba(100, 116, 139, 0.5)';
      }),
      borderColor: sortedFeatures.map(([, v]) => {
        if (v >= 0.15) return '#6366f1';
        if (v >= 0.08) return '#3b82f6';
        return '#64748b';
      }),
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  // 4. Model Comparison Bar
  const comparisonData = {
    labels: ['Accuracy', 'Precision', 'Recall', 'F1-Score'],
    datasets: [
      {
        label: 'Random Forest',
        data: [rf.metrics.accuracy, rf.metrics.precision, rf.metrics.recall, rf.metrics.f1Score].map((v) => +(v * 100).toFixed(1)),
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: '#22c55e',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Logistic Regression',
        data: [lr.metrics.accuracy, lr.metrics.precision, lr.metrics.recall, lr.metrics.f1Score].map((v) => +(v * 100).toFixed(1)),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: '#3b82f6',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  // 5. Training History (accuracy over epochs)
  const historyData = {
    labels: rf.history.map((h) => `Epoch ${h.epoch}`),
    datasets: [
      {
        label: 'Random Forest',
        data: rf.history.map((h) => +(h.accuracy * 100).toFixed(1)),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
      },
      {
        label: 'Logistic Regression',
        data: lr.history.map((h) => +(h.accuracy * 100).toFixed(1)),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
      },
    ],
  };

  /* ──────── Chart Options ──────── */
  const barOptions = (titleText) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: titleText, color: '#e2e8f0', font: { size: 14, weight: 700, family: 'Inter' } },
      legend: { labels: { color: '#94a3b8', font: { family: 'Inter' } } },
      tooltip: { backgroundColor: '#1e293b', titleColor: '#f1f5f9', bodyColor: '#94a3b8' },
    },
    scales: {
      x: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: 'rgba(148,163,184,0.08)' } },
      y: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: 'rgba(148,163,184,0.08)' } },
    },
  });

  const horizontalBarOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: 'Feature Importance (%)', color: '#e2e8f0', font: { size: 14, weight: 700, family: 'Inter' } },
      legend: { display: false },
      tooltip: { backgroundColor: '#1e293b', callbacks: { label: (ctx) => `${ctx.parsed.x}%` } },
    },
    scales: {
      x: { ticks: { color: '#64748b', callback: (v) => `${v}%` }, grid: { color: 'rgba(148,163,184,0.08)' } },
      y: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { display: false } },
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: 'Training Accuracy Over Epochs', color: '#e2e8f0', font: { size: 14, weight: 700, family: 'Inter' } },
      legend: { labels: { color: '#94a3b8', font: { family: 'Inter' } } },
      tooltip: { backgroundColor: '#1e293b', callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}%` } },
    },
    scales: {
      x: { ticks: { color: '#64748b', maxTicksLimit: 10 }, grid: { color: 'rgba(148,163,184,0.08)' } },
      y: { min: 50, max: 100, ticks: { color: '#64748b', callback: (v) => `${v}%` }, grid: { color: 'rgba(148,163,184,0.08)' } },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: 'Class Distribution', color: '#e2e8f0', font: { size: 14, weight: 700, family: 'Inter' } },
      legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 16, font: { family: 'Inter' } } },
    },
  };

  /* ──────── Metric helper ──────── */
  const MetricBadge = ({ value, label }) => {
    const pct = (value * 100).toFixed(1);
    const cls = value >= 0.85 ? 'excellent' : value >= 0.7 ? 'good' : 'fair';
    return (
      <div className={`metric-badge ${cls}`}>
        <div className="metric-value">{pct}%</div>
        <div className="metric-label">{label}</div>
      </div>
    );
  };

  return (
    <div className="results-page" id="results-page">
      <div className="results-header">
        <h1> Model Training Results</h1>
        <p>
          Trained on {new Date(trainingResults.trainedAt).toLocaleString()} •{' '}
          {summary.totalSamples} samples • {summary.featureCount} features
        </p>
      </div>

      {/* ──── Row 1: Data Summary ──── */}
      <div className="results-grid-3">
        <div className="card stat-card">
          <div className="stat-card-icon"></div>
          <div className="stat-card-value">{summary.totalSamples.toLocaleString()}</div>
          <div className="stat-card-label">Total Samples</div>
        </div>
        <div className="card stat-card">
          <div className="stat-card-icon">️</div>
          <div className="stat-card-value">{summary.featureCount}</div>
          <div className="stat-card-label">Features Used</div>
        </div>
        <div className="card stat-card">
          <div className="stat-card-icon"></div>
          <div className="stat-card-value">{(rf.metrics.accuracy * 100).toFixed(1)}%</div>
          <div className="stat-card-label">Best Accuracy (RF)</div>
        </div>
      </div>

      {/* ──── Row 2: Class Distribution + Rainfall vs Risk ──── */}
      <div className="results-grid-2">
        <div className="card chart-card">
          <div style={{ height: '300px' }}>
            <Doughnut data={classDistData} options={doughnutOptions} />
          </div>
          <div className="class-dist-table">
            {['Low', 'Medium', 'High'].map((cls) => (
              <div key={cls} className={`class-row ${cls.toLowerCase()}`}>
                <span className="class-name">{cls}</span>
                <span className="class-count">{summary.classDistribution[cls]}</span>
                <span className="class-pct">{summary.classPercentages[cls]}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card chart-card">
          <div style={{ height: '380px' }}>
            <Bar data={rainfallChartData} options={{ ...barOptions('Rainfall vs Flood Risk'), scales: { ...barOptions('').scales, x: { ...barOptions('').scales.x, stacked: true }, y: { ...barOptions('').scales.y, stacked: true } } }} />
          </div>
        </div>
      </div>

      {/* ──── Row 3: Feature Importance ──── */}
      <div className="card chart-card">
        <div style={{ height: '400px' }}>
          <Bar data={featureChartData} options={horizontalBarOptions} />
        </div>
      </div>

      {/* ──── Row 4: Training History ──── */}
      <div className="card chart-card">
        <div style={{ height: '350px' }}>
          <Line data={historyData} options={lineOptions} />
        </div>
      </div>

      {/* ──── Row 5: Model Comparison ──── */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"> Model Comparison</div>
        </div>

        <div className="results-grid-2" style={{ gap: 'var(--space-lg)' }}>
          {/* Random Forest Metrics */}
          <div className="model-result-card rf">
            <h3> Random Forest</h3>
            <div className="metrics-grid">
              <MetricBadge value={rf.metrics.accuracy} label="Accuracy" />
              <MetricBadge value={rf.metrics.precision} label="Precision" />
              <MetricBadge value={rf.metrics.recall} label="Recall" />
              <MetricBadge value={rf.metrics.f1Score} label="F1-Score" />
            </div>
          </div>
          {/* Logistic Regression Metrics */}
          <div className="model-result-card lr">
            <h3> Logistic Regression</h3>
            <div className="metrics-grid">
              <MetricBadge value={lr.metrics.accuracy} label="Accuracy" />
              <MetricBadge value={lr.metrics.precision} label="Precision" />
              <MetricBadge value={lr.metrics.recall} label="Recall" />
              <MetricBadge value={lr.metrics.f1Score} label="F1-Score" />
            </div>
          </div>
        </div>

        {/* Comparison Bar Chart */}
        <div style={{ height: '300px', marginTop: 'var(--space-lg)' }}>
          <Bar data={comparisonData} options={barOptions('Model Performance Comparison (%)')} />
        </div>

        {/* Comparison Table */}
        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Accuracy</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>F1-Score</th>
                <th>Verdict</th>
              </tr>
            </thead>
            <tbody>
              <tr className="rf-row">
                <td><strong> Random Forest</strong></td>
                <td>{(rf.metrics.accuracy * 100).toFixed(1)}%</td>
                <td>{(rf.metrics.precision * 100).toFixed(1)}%</td>
                <td>{(rf.metrics.recall * 100).toFixed(1)}%</td>
                <td>{(rf.metrics.f1Score * 100).toFixed(1)}%</td>
                <td><span className="verdict-badge best"> Best</span></td>
              </tr>
              <tr className="lr-row">
                <td><strong> Logistic Regression</strong></td>
                <td>{(lr.metrics.accuracy * 100).toFixed(1)}%</td>
                <td>{(lr.metrics.precision * 100).toFixed(1)}%</td>
                <td>{(lr.metrics.recall * 100).toFixed(1)}%</td>
                <td>{(lr.metrics.f1Score * 100).toFixed(1)}%</td>
                <td><span className="verdict-badge baseline">Baseline</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ──── Row 6: Confusion Matrices ──── */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"> Confusion Matrices</div>
        </div>
        <div className="results-grid-2">
          <ConfusionMatrix confusion={rf.confusion} title=" Random Forest" />
          <ConfusionMatrix confusion={lr.confusion} title=" Logistic Regression" />
        </div>
      </div>

      {/* ──── Row 7: Feature Statistics ──── */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"> Feature Statistics</div>
        </div>
        <div className="comparison-table-wrapper">
          <table className="comparison-table feature-stats-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Mean</th>
                <th>Median</th>
                <th>Min</th>
                <th>Max</th>
                <th>Std Dev</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(featureStats).map(([name, stats]) => (
                <tr key={name}>
                  <td><strong>{name.replace(/_/g, ' ')}</strong></td>
                  <td>{stats.mean}</td>
                  <td>{stats.median}</td>
                  <td>{stats.min}</td>
                  <td>{stats.max}</td>
                  <td>{stats.std}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

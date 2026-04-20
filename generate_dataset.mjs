// Generate NASA Multi-Hazard Dataset as CSV
import { generateNASADataset } from './src/services/trainingService.js';
import { writeFileSync } from 'fs';

const { features, data } = generateNASADataset(2000);

// Build CSV
const headers = [...features, 'risk_class'];
const rows = data.map(row => headers.map(h => row[h]).join(','));
const csv = [headers.join(','), ...rows].join('\n');

writeFileSync('nasa_multihazard_dataset.csv', csv);
console.log(`✅ Dataset generated: nasa_multihazard_dataset.csv`);
console.log(`   Samples: ${data.length}`);
console.log(`   Features: ${features.length}`);

// Class distribution
const counts = { Low: 0, Medium: 0, High: 0 };
data.forEach(d => counts[d.risk_class]++);
console.log(`   Distribution: Low=${counts.Low}, Medium=${counts.Medium}, High=${counts.High}`);

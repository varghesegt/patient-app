// Advanced mock triage API client
export async function postTriage(text) {
  // Simulate realistic network latency (500-1000ms)
  await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));

  const input = (text || '').toLowerCase();

  // Define symptoms with severity weight
  const symptomDatabase = [
    { keyword: 'chest pain', severity: 90, label: 'CRITICAL', action: 'Call emergency services immediately' },
    { keyword: 'shortness of breath', severity: 85, label: 'CRITICAL', action: 'Seek urgent care' },
    { keyword: 'high fever', severity: 70, label: 'HIGH', action: 'Visit doctor soon' },
    { keyword: 'fever', severity: 40, label: 'MODERATE', action: 'Monitor symptoms and rest' },
    { keyword: 'cough', severity: 30, label: 'SAFE', action: 'Home care recommended' },
    { keyword: 'headache', severity: 20, label: 'SAFE', action: 'Rest and hydration' },
  ];

  let detectedSymptoms = [];
  let totalScore = 0;

  symptomDatabase.forEach((symptom) => {
    if (input.includes(symptom.keyword)) {
      detectedSymptoms.push({
        keyword: symptom.keyword,
        severity: symptom.severity,
        label: symptom.label,
        action: symptom.action,
      });
      totalScore += symptom.severity;
    }
  });

  // Normalize score to 0-100 scale
  const score = Math.min(totalScore, 100);

  // Determine overall label based on highest severity symptom
  const highestSeverity = detectedSymptoms.reduce((prev, curr) => (curr.severity > prev ? curr.severity : prev), 0);
  let overallLabel = 'SAFE';
  if (highestSeverity >= 85) overallLabel = 'CRITICAL';
  else if (highestSeverity >= 70) overallLabel = 'HIGH';
  else if (highestSeverity >= 40) overallLabel = 'MODERATE';

  // Collect reasons
  const reasons = detectedSymptoms.map((s) => s.keyword);

  // Recommended actions
  const actions = detectedSymptoms.map((s) => s.action);

  return {
    score,
    label: overallLabel,
    reasons,
    actions,
    detectedSymptoms,
    rawInput: text,
  };
}

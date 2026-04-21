function calcEffectiveReps(arr) {
  const valid = arr.filter((v) => v != null);
  if (!valid.length) return null;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
}

function calcEffectiveWeight(arr) {
  const valid = arr.filter((v) => v != null && v > 0);
  if (!valid.length) return null;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
}

// soporta rangos tipo "8-10", compara por el mínimo
function compareReps(newReps, oldReps) {
  const parseMin = (r) => parseInt(String(r).split("-")[0], 10) || 0;
  const n = parseMin(newReps);
  const o = parseMin(oldReps);
  if (n > o) return "↑";
  if (n < o) return "↓";
  return "~";
}

module.exports = { calcEffectiveReps, calcEffectiveWeight, compareReps };
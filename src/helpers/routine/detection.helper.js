// decide si hay que pedirle ajustes a la IA o todavía no
async function shouldAdjustRoutine(routine, sessionCount, summary, wantsFasterAdjustments) {
  const minSessions = routine.experience === "advanced" ? 2 : 3;
  if (sessionCount < minSessions) return false;

  const getScheduledAdjustment = () => {
    switch (routine.experience) {
      case "beginner":
        return sessionCount % 4 === 0; // cada 4 sesiones, no tiene sentido ajustar antes
      case "intermediate":
        return sessionCount % 3 === 0;
      case "advanced":
        // el user puede pedir ajustes más seguido si quiere
        return wantsFasterAdjustments ? sessionCount % 2 === 0 : sessionCount % 3 === 0;
      default:
        return sessionCount % 3 === 0;
    }
  };

  if (getScheduledAdjustment()) return true;

  // con pocas sesiones no hay suficiente data para detectar estancamiento
  if (sessionCount >= 6) {
    const stagnation = detectStagnation(summary);
    if (stagnation) return true;
  }

  if (sessionCount >= 4) {
    const overtraining = detectOvertraining(summary, routine.experience);
    if (overtraining) return true;
  }

  return false;
}

// más del 50% de ejercicios sin progreso = estancamiento
function detectStagnation(summary) {
  let exercisesWithoutProgress = 0;

  for (const ex of summary) {
    if (!ex.executed) continue;

    const hasProgress =
      ex.executed.avgWeight > (ex.planned?.weight || 0) ||
      ex.executed.avgReps > (ex.planned?.reps || 0);

    if (ex.status === "completed" && !hasProgress) {
      exercisesWithoutProgress++;
    }
  }

  return exercisesWithoutProgress / summary.length >= 0.5;
}

// demasiadas series salteadas es señal de que algo no está bien
function detectOvertraining(summary, experience) {
  let skippedSetsCount = 0;
  let totalSets = 0;

  for (const ex of summary) {
    if (ex.executed) {
      const skipRatio = ex.executed.skippedSets / (ex.executed.totalSets || 1);
      if (skipRatio > 0.3) skippedSetsCount++;
      totalSets++;
    }
  }

  // TODO: habría que pasar el feedback acá para usar el painLevel también

  // principiantes se cansan antes, umbral más bajo
  const skipThreshold = experience === "beginner" ? 0.2 : 0.35;
  return skippedSetsCount / (totalSets || 1) >= skipThreshold;
}

module.exports = { shouldAdjustRoutine, detectStagnation, detectOvertraining };
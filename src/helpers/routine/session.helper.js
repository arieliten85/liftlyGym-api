const { calcEffectiveReps, calcEffectiveWeight } = require("./math.helper");

// compara lo que se planeó con lo que realmente hizo el user
function buildSessionSummary(plannedExercises, executedExercises) {
  return plannedExercises.map((planned) => {
    const executed = executedExercises.find((e) => e.name === planned.name);

    if (!executed || executed.setLogs.length === 0) {
      return {
        exercise: planned.name,
        planned: {
          sets: planned.sets,
          reps: planned.reps,
          weight: planned.weight,
          restSeconds: planned.restSeconds,
        },
        executed: null,
        status: "skipped",
      };
    }

    const completedLogs = executed.setLogs.filter((s) => !s.skipped);
    const skippedLogs = executed.setLogs.filter((s) => s.skipped);

    return {
      exercise: planned.name,
      planned: {
        sets: planned.sets,
        reps: planned.reps,
        weight: planned.weight,
        restSeconds: planned.restSeconds,
      },
      executed: {
        totalSets: executed.setLogs.length,
        completedSets: completedLogs.length,
        skippedSets: skippedLogs.length,
        avgReps: calcEffectiveReps(completedLogs.map((s) => s.repsCompleted)),
        avgWeight: calcEffectiveWeight(completedLogs.map((s) => s.weight)),
      },
      status:
        completedLogs.length >= planned.sets
          ? "completed"
          : completedLogs.length > 0
            ? "partial"
            : "skipped",
    };
  });
}

// snapshot de los valores actuales antes de tocar nada
function buildPreviousValues(routineExercises, adjustments) {
  const prev = {};
  for (const adj of adjustments) {
    const current = routineExercises.find((e) => e.name === adj.name);
    if (current) {
      prev[adj.name] = {
        sets: current.sets,
        reps: current.reps,
        weight: current.weight ?? null,
        restSeconds: current.restSeconds,
      };
    }
  }
  return prev;
}

module.exports = { buildSessionSummary, buildPreviousValues };

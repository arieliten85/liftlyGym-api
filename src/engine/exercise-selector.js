const exerciseService = require("../services/exercise.service");

function isCompound(exerciseName) {
  const normalized = exerciseName.toLowerCase();
  const compoundPatterns = [
    "press",
    "squat",
    "deadlift",
    "pull-up",
    "pull up",
    "row",
    "lunge",
    "hip thrust",
  ];
  return compoundPatterns.some((pattern) => normalized.includes(pattern));
}

function shuffle(exercises) {
  return [...exercises].sort(() => 0.5 - Math.random());
}

async function seleccionarEjercicios({ musculos, equipamiento, volumen }) {
  const availableExercises = await exerciseService.getByMuscles(
    musculos,
    equipamiento,
  );

  if (availableExercises.length === 0) {
    console.warn(
      `[engine] ExerciseDB returned no exercises — muscles: ${musculos.join(",")}, equipment: ${equipamiento}`,
    );
    return [];
  }

  const routine = [];
  const usedIds = new Set();

  for (const muscle of musculos) {
    if (routine.length >= volumen) break;
    const muscleExercises = availableExercises.filter(
      (exercise) => exercise.muscle === muscle,
    );
    const preferred =
      muscleExercises.find((exercise) => isCompound(exercise.name)) ??
      muscleExercises[0];
    if (preferred && !usedIds.has(preferred.externalExerciseId)) {
      routine.push(preferred);
      usedIds.add(preferred.externalExerciseId);
    }
  }

  for (const exercise of shuffle(availableExercises)) {
    if (routine.length >= volumen) break;
    if (usedIds.has(exercise.externalExerciseId)) continue;
    routine.push(exercise);
    usedIds.add(exercise.externalExerciseId);
  }

  return routine;
}

module.exports = { seleccionarEjercicios };

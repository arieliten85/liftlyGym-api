const exercisedbService = require("./exercisedb.service");
const localExercises = require("../data/exercises.mock");

function canUseLocalFallback(error) {
  return (
    error?.code === "EXERCISE_PROVIDER_NOT_CONFIGURED" ||
    error?.code === "EXERCISE_PROVIDER_UNAVAILABLE" ||
    error?.code === "EXERCISE_PROVIDER_TIMEOUT" ||
    error?.code === "EXERCISE_PROVIDER_RATE_LIMIT"
  );
}

function equipmentMatches(exerciseEquipment = [], requestedEquipment) {
  if (!requestedEquipment) return true;
  if (requestedEquipment === "basic") return true;
  return exerciseEquipment.includes(requestedEquipment);
}

function mapLocalExercise(exercise) {
  return {
    id: `local:${exercise.slug}`,
    externalExerciseId: `local:${exercise.slug}`,
    name: exercise.name,
    muscle: exercise.muscle,
    equipment: exercise.equipment,
    imageUrl: null,
    gifUrl: null,
    videoUrl: null,
    instructions: [],
    overview: null,
    exerciseTips: [],
    source: "local-catalog",
  };
}

function getLocalByMuscles(muscles, equipment) {
  const requestedMuscles = new Set(muscles.filter(Boolean));
  return localExercises
    .filter((exercise) => requestedMuscles.has(exercise.muscle))
    .filter((exercise) => equipmentMatches(exercise.equipment, equipment))
    .map(mapLocalExercise);
}

function getLocalById(exerciseId) {
  const slug = String(exerciseId ?? "").replace(/^local:/, "");
  const exercise = localExercises.find((item) => item.slug === slug);
  return exercise ? mapLocalExercise(exercise) : null;
}

async function getByMuscle(muscle, equipment) {
  return getByMuscles([muscle], equipment);
}

async function getByMuscles(muscles, equipment) {
  try {
    return await exercisedbService.getByMuscles(muscles, equipment);
  } catch (error) {
    if (!canUseLocalFallback(error)) throw error;
    console.warn(
      "[exercise.service] Using local exercise fallback:",
      error.code ?? error.name,
    );
    return getLocalByMuscles(muscles, equipment);
  }
}

async function getAll() {
  try {
    return await exercisedbService.getAll();
  } catch (error) {
    if (!canUseLocalFallback(error)) throw error;
    console.warn(
      "[exercise.service] Using local exercise fallback:",
      error.code ?? error.name,
    );
    return localExercises.map(mapLocalExercise);
  }
}

async function getById(exerciseId) {
  const localExercise = getLocalById(exerciseId);
  if (localExercise) return localExercise;
  return exercisedbService.getById(exerciseId);
}

async function getByIds(exerciseIds) {
  const localResults = [];
  const providerIds = [];

  for (const exerciseId of exerciseIds.filter(Boolean)) {
    const localExercise = getLocalById(exerciseId);
    if (localExercise) localResults.push(localExercise);
    else providerIds.push(exerciseId);
  }

  if (providerIds.length === 0) return localResults;

  try {
    return [...localResults, ...(await exercisedbService.getByIds(providerIds))];
  } catch (error) {
    if (!canUseLocalFallback(error)) throw error;
    console.warn(
      "[exercise.service] ExerciseDB media unavailable:",
      error.code ?? error.name,
    );
    return localResults;
  }
}

module.exports = { getByMuscle, getByMuscles, getAll, getById, getByIds };

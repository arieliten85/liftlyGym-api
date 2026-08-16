const liftApiExercises = require("../providers/liftApiExercise.provider");

function normalize(str = "") {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizeIdentity(str = "") {
  return normalize(str).replace(/[-\s]+/g, "_");
}

function catalogKeys(exercise) {
  return [...new Set([exercise.slug, exercise.name].filter(Boolean).map(normalizeIdentity))];
}

const muscleAliases = {
  chest: ["chest", "pecho"],
  pecho: ["pecho", "chest"],
  back: ["back", "espalda"],
  espalda: ["espalda", "back"],
  biceps: ["biceps", "bicep", "biceps brachii"],
  triceps: ["triceps", "tricep"],
  legs: ["legs", "leg", "quadriceps", "hamstrings", "glutes", "calves", "piernas"],
  piernas: ["piernas", "legs", "quadriceps", "hamstrings", "glutes", "calves"],
  core: ["core", "abs", "abdominals", "abdominales"],
  abdominales: ["abdominales", "core", "abs", "abdominals"],
  shoulders: ["shoulders", "shoulder", "hombros"],
  hombros: ["hombros", "shoulders", "shoulder"],
  glutes: ["glutes", "glute", "gluteos"],
  gluteos: ["gluteos", "glutes", "glute"],
};

const equipmentAliases = {
  basic: ["dumbbells", "bands", "bodyweight"],
  gym: ["gym"],
  dumbbell: ["dumbbells"],
  dumbbells: ["dumbbells"],
  mancuerna: ["dumbbells"],
  mancuernas: ["dumbbells"],
  band: ["bands"],
  bands: ["bands"],
  bandas: ["bands"],
  bodyweight: ["bodyweight"],
  peso_corporal: ["bodyweight"],
};

function expandMuscles(muscles) {
  return new Set(
    muscles.flatMap((muscle) => {
      const normalized = normalize(muscle);
      return muscleAliases[normalized] ?? [normalized];
    }),
  );
}

function expandEquipment(equipment = []) {
  return new Set(
    equipment.filter(Boolean).flatMap((item) => {
      const normalized = normalizeIdentity(item);
      return equipmentAliases[normalized] ?? [normalized];
    }),
  );
}

async function getExerciseCatalog() {
  try {
    return await liftApiExercises.getCatalog();
  } catch (error) {
    const serviceError = new Error("Exercise catalog is temporarily unavailable");
    serviceError.code = "EXERCISE_CATALOG_UNAVAILABLE";
    serviceError.cause = error;
    throw serviceError;
  }
}

function filterByEquipment(exercises, equipmentParam) {
  if (!equipmentParam || equipmentParam.length === 0) return exercises;
  const equipmentSet = expandEquipment(equipmentParam);
  if (equipmentSet.size === 0) return exercises;

  return exercises.filter((item) =>
    item.equipment.some((eq) => equipmentSet.has(normalizeIdentity(eq))),
  );
}

async function getByMuscle(muscleParam, equipmentParam) {
  // Si muscleParam contiene comas, dividir en múltiples músculos
  const muscles = muscleParam.includes(",")
    ? muscleParam.split(",").map(m => m.trim())
    : [muscleParam];
  const muscleSet = expandMuscles(muscles);
  
  // Buscar ejercicios que tengan cualquiera de estos músculos
  const all = await getExerciseCatalog();
  const byMuscle = all.filter((item) => muscleSet.has(normalize(item.muscle)));

  return filterByEquipment(byMuscle, equipmentParam);
}

async function getByMuscles(musclesArray, equipmentParam) {
  const all = await getExerciseCatalog();
  const muscleSet = expandMuscles(musclesArray);
  const byMuscle = all.filter((item) => muscleSet.has(normalize(item.muscle)));

  return filterByEquipment(byMuscle, equipmentParam);
}

async function getAll() {
  const exercises = await getExerciseCatalog();
  return exercises.sort((a, b) => a.muscle.localeCompare(b.muscle));
}

async function getByName(name) {
  const nameKey = normalizeIdentity(name);
  try {
    const liftApiExercise = await liftApiExercises.getByName(name);
    if (liftApiExercise) return liftApiExercise;

    const catalog = await liftApiExercises.getCatalog();
    return catalog.find((item) => catalogKeys(item).includes(nameKey)) ?? null;
  } catch (error) {
    const serviceError = new Error("Exercise detail is temporarily unavailable");
    serviceError.code = "EXERCISE_CATALOG_UNAVAILABLE";
    serviceError.cause = error;
    throw serviceError;
  }
}

async function create() {
  const error = new Error("Exercise catalog is read-only because lift-api is the source of truth");
  error.code = "EXERCISE_CATALOG_READ_ONLY";
  throw error;
}

async function updateMedia() {
  const error = new Error("Exercise media is read-only because lift-api is the source of truth");
  error.code = "EXERCISE_CATALOG_READ_ONLY";
  throw error;
}

module.exports = { getByMuscle, getByMuscles, getAll, getByName, create, updateMedia, getExerciseCatalog };

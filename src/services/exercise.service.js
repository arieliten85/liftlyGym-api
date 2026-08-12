const prisma = require("../lib/prisma");
const fallbackExercises = require("../data/exercises.mock");

function normalize(str = "") {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

async function getExerciseCatalog() {
  const exercises = await prisma.exercise.findMany({ orderBy: { muscle: "asc" } });
  return exercises.length > 0 ? exercises : fallbackExercises;
}

 async function getByMuscle(muscleParam, equipmentParam) {
  // Si muscleParam contiene comas, dividir en múltiples músculos
  const muscles = muscleParam.includes(",") 
    ? muscleParam.split(",").map(m => m.trim().toLowerCase())
    : [muscleParam.toLowerCase()];
  
  // Buscar ejercicios que tengan cualquiera de estos músculos
  const all = (await getExerciseCatalog()).filter((exercise) =>
    muscles.includes(exercise.muscle),
  );

  if (!equipmentParam || equipmentParam.length === 0) return all;

  const filtered = all.filter((item) =>
    item.equipment.some((eq) => equipmentParam.includes(eq)),
  );

  return filtered.length > 0 ? filtered : all;
}

 async function getByMuscles(musclesArray, equipmentParam) {
  const muscles = musclesArray.map((muscle) => muscle.trim().toLowerCase());
  const all = (await getExerciseCatalog()).filter((exercise) =>
    muscles.includes(exercise.muscle),
  );

  if (!equipmentParam || equipmentParam.length === 0) return all;

  const filtered = all.filter((item) =>
    item.equipment.some((eq) => equipmentParam.includes(eq)),
  );

  return filtered.length > 0 ? filtered : all;
}

async function getAll() {
  return getExerciseCatalog();
}

async function getByName(name) {
  return prisma.exercise.findUnique({ where: { name } });
}

async function create({ name, muscle, equipment }) {
  const nameNorm = normalize(name);
  const existing = await prisma.exercise.findMany();
  const exists = existing.some((ex) => normalize(ex.name) === nameNorm);

  if (exists) {
    const err = new Error("Nombre duplicado");
    err.code = "DUPLICATE_NAME";
    err.name = name;
    throw err;
  }

  return prisma.exercise.create({
    data: {
      name: name.trim().toLowerCase().replace(/\s+/g, "_"),
      muscle: muscle.trim().toLowerCase(),
      equipment: equipment.map((e) => e.trim().toLowerCase()),
      imageUrl: null,
      gifUrl: null,
    },
  });
}

async function updateMedia(name, { imageUrl, gifUrl }) {
  return prisma.exercise.update({
    where: { name },
    data: {
      ...(imageUrl !== undefined && { imageUrl }),
      ...(gifUrl !== undefined && { gifUrl }),
    },
  });
}

module.exports = { getByMuscle, getByMuscles, getAll, getByName, create, updateMedia };

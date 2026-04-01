const exercisesDB = require("../data/exercises.mock");

function normalize(str = "") {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

async function getByMuscle(muscleParam, equipmentParam) {
  let results = exercisesDB.filter((item) => item.muscle === muscleParam);

  if (equipmentParam && equipmentParam.length > 0) {
    results = results.filter((item) =>
      item.equipment.some((eq) => equipmentParam.includes(eq)),
    );
  }

  return results;
}

async function getAll() {
  return exercisesDB;
}

async function getAll() {
  return exercisesDB;
}

async function create({ name, muscle, equipment }) {
  const nameNorm = normalize(name);
  const exists = exercisesDB.some((ex) => normalize(ex.name) === nameNorm);
  if (exists) {
    const err = new Error("Nombre duplicado");
    err.code = "DUPLICATE_NAME";
    err.name = name;
    throw err;
  }
  const newExercise = {
    name: name.trim().toLowerCase().replace(/\s+/g, "_"),
    muscle: muscle.trim().toLowerCase(),
    equipment: equipment.map((e) => e.trim().toLowerCase()),
  };
  exercisesDB.push(newExercise);
  return newExercise;
}

module.exports = { getByMuscle, getAll, create };

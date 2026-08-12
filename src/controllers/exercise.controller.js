const exerciseService = require("../services/exercise.service");
const {
  ExerciseProviderError,
} = require("../services/exercisedb.service");

function handleExerciseError(error, res, operation) {
  console.error(`[${operation}]`, error.code ?? error.name);

  if (error instanceof ExerciseProviderError) {
    const status =
      error.code === "INVALID_EXERCISE_ID"
        ? 400
        : error.code === "EXERCISE_PROVIDER_RATE_LIMIT"
          ? 429
          : error.status === 404
            ? 404
            : 503;
    return res.status(status).json({ success: false, message: error.message });
  }

  return res
    .status(500)
    .json({ success: false, message: "Error interno" });
}

const getByMuscle = async (req, res) => {
  try {
    const { muscle, equipment } = req.query;
    if (!muscle || typeof muscle !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "Se requiere el parámetro muscle" });
    }

    const exercises = await exerciseService.getByMuscle(muscle, equipment);
    return res.status(200).json({ success: true, data: exercises });
  } catch (error) {
    return handleExerciseError(error, res, "getByMuscle");
  }
};

const getByMuscles = async (req, res) => {
  try {
    const { muscles, equipment } = req.query;
    if (!muscles || typeof muscles !== "string") {
      return res.status(400).json({
        success: false,
        message: "Se requiere el parámetro muscles",
      });
    }

    const musclesArray = muscles.split(",").map((muscle) => muscle.trim());
    const exercises = await exerciseService.getByMuscles(
      musclesArray,
      equipment,
    );
    return res.status(200).json({ success: true, data: exercises });
  } catch (error) {
    return handleExerciseError(error, res, "getByMuscles");
  }
};

const getAll = async (_req, res) => {
  try {
    const exercises = await exerciseService.getAll();
    return res.status(200).json({ success: true, data: exercises });
  } catch (error) {
    return handleExerciseError(error, res, "getAll");
  }
};

const getById = async (req, res) => {
  try {
    const exercise = await exerciseService.getById(req.params.exerciseId);
    return res.status(200).json({ success: true, data: exercise });
  } catch (error) {
    return handleExerciseError(error, res, "getById");
  }
};

module.exports = { getByMuscle, getByMuscles, getAll, getById };

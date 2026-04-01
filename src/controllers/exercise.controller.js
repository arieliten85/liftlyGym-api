const exerciseService = require("../services/exercise.service");

 const getByMuscle = async (req, res) => {
  try {
    const { muscle, equipment } = req.query;

    if (!muscle) {
      return res.status(400).json({
        success: false,
        message: "El parámetro 'muscle' es requerido.",
      });
    }

     const equipmentList = equipment
      ? Array.isArray(equipment)
        ? equipment
        : equipment.split(",")
      : [];

    const exercises = await exerciseService.getByMuscle(muscle, equipmentList);
    return res.status(200).json({ success: true, data: exercises });
  } catch (error) {
    console.error("[getByMuscle]", error);
    return res.status(500).json({
      success: false,
      message: "Error interno al obtener ejercicios.",
    });
  }
};

 const getAll = async (req, res) => {
  try {
    const exercises = await exerciseService.getAll();
    return res.status(200).json({ success: true, data: exercises });
  } catch (error) {
    console.error("[getAll]", error);
    return res.status(500).json({
      success: false,
      message: "Error interno al obtener todos los ejercicios.",
    });
  }
};

 
const createExercise = async (req, res) => {
  try {
    const { name, muscle, equipment } = req.body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "El campo 'name' es requerido.",
      });
    }
    if (!muscle || typeof muscle !== "string" || muscle.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "El campo 'muscle' es requerido.",
      });
    }
    if (!equipment || !Array.isArray(equipment) || equipment.length === 0) {
      return res.status(400).json({
        success: false,
        message: "El campo 'equipment' debe ser un array con al menos un elemento.",
      });
    }

    const newExercise = await exerciseService.create({ name, muscle, equipment });
    return res.status(201).json({ success: true, data: newExercise });
  } catch (error) {
    if (error.code === "DUPLICATE_NAME") {
      return res.status(409).json({
        success: false,
        message: `Ya existe un ejercicio con el nombre '${error.name}'.`,
      });
    }
    console.error("[createExercise]", error);
    return res.status(500).json({
      success: false,
      message: "Error interno al crear el ejercicio.",
    });
  }
};

module.exports = { getByMuscle, getAll, createExercise };
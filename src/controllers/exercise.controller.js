const exerciseService = require("../services/exercise.service");

const getByMuscle = async (req, res) => {
  try {
    const { muscle, equipment } = req.query;
    const exercises = await exerciseService.getByMuscle(muscle, equipment?.split(","));
    res.status(200).json({ success: true, data: exercises });
  } catch (error) {
    console.error("[getByMuscle]", error);
    res.status(500).json({ success: false, message: "Error interno" });
  }
};

 const getByMuscles = async (req, res) => {
  try {
    const { muscles, equipment } = req.query;
    if (!muscles) {
      return res.status(400).json({ success: false, message: "Se requiere el parámetro muscles" });
    }
    const musclesArray = muscles.split(",").map(m => m.trim());
    const exercises = await exerciseService.getByMuscles(musclesArray, equipment?.split(","));
    res.status(200).json({ success: true, data: exercises });
  } catch (error) {
    console.error("[getByMuscles]", error);
    res.status(500).json({ success: false, message: "Error interno" });
  }
};

const getAll = async (req, res) => {
  try {
    const exercises = await exerciseService.getAll();
    res.status(200).json({ success: true, data: exercises });
  } catch (error) {
    console.error("[getAll]", error);
    res.status(500).json({ success: false, message: "Error interno" });
  }
};

const createExercise = async (req, res) => {
  try {
    const { name, muscle, equipment } = req.body;
    const exercise = await exerciseService.create({ name, muscle, equipment });
    res.status(201).json({ success: true, data: exercise });
  } catch (error) {
    console.error("[createExercise]", error);
    if (error.code === "DUPLICATE_NAME") {
      return res.status(400).json({ success: false, message: "Nombre duplicado" });
    }
    res.status(500).json({ success: false, message: "Error interno" });
  }
};

const updateExerciseMedia = async (req, res) => {
  try {
    const { name } = req.params;
    const { imageUrl, gifUrl } = req.body;
    if (!imageUrl && !gifUrl) {
      return res.status(400).json({ success: false, message: "Debe enviar imageUrl o gifUrl" });
    }
    const updated = await exerciseService.updateMedia(name, { imageUrl, gifUrl });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("[updateExerciseMedia]", error);
    res.status(500).json({ success: false, message: "Error interno" });
  }
};

module.exports = { getByMuscle, getByMuscles, getAll, createExercise, updateExerciseMedia };
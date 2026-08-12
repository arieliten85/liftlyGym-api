const routineService = require("../services/routine.service");

exports.generateRoutine = async (req, res) => {
  try {
    const routine = await routineService.generateRoutine(req.user.id, req.body);
    res.status(201).json({ success: true, data: routine });
  } catch (error) {
    console.error("[generateRoutine]", error.code ?? error.message);
    if (
      error.code?.startsWith("EXERCISE_PROVIDER_") ||
      error.message === "EXERCISE_PROVIDER_EMPTY"
    ) {
      return res.status(503).json({
        error: "El catálogo de ejercicios no está disponible en este momento",
      });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

exports.completeSession = async (req, res) => {
  try {
    const result = await routineService.completeSession(req.user.id, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

exports.getUserRoutines = async (req, res) => {
  try {
    const routines = await routineService.getUserRoutines(req.user.id);
    res.status(200).json({ success: true, data: routines });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

exports.getRoutineProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const progress = await routineService.getRoutineProgress(req.user.id, id);
    res.status(200).json({ success: true, data: progress });
  } catch (error) {
    console.error(error);
    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Rutina no encontrada" });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

exports.deleteRoutine = async (req, res) => {
  try {
    await routineService.deleteRoutine(req.user.id, req.params.id);
    res.status(200).json({ success: true, message: "Rutina eliminada" });
  } catch (error) {
    console.error(error);
    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Rutina no encontrada" });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

exports.applyPendingAdjustments = async (req, res) => {
  try {
    const { id } = req.params;
    const { notificationId } = req.body;

    if (!notificationId) {
      return res.status(400).json({ error: "notificationId requerido" });
    }

    const result = await routineService.applyPendingAdjustments(
      req.user.id,
      id,
      notificationId,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Rutina no encontrada" });
    }
    if (error.message === "NO_PENDING_ADJUSTMENTS") {
      return res.status(404).json({ error: "No hay ajustes pendientes" });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

exports.replaceExercise = async (req, res) => {
  try {
    const { id } = req.params;
    const { exerciseName, newExternalExerciseId } = req.body;
    if (!exerciseName || !newExternalExerciseId) {
      return res.status(400).json({
        error: "exerciseName y newExternalExerciseId requeridos",
      });
    }
    const result = await routineService.replaceExercise(
      req.user.id,
      id,
      exerciseName,
      newExternalExerciseId,
    );
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("[replaceExercise]", error.code ?? error.message);
    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Rutina no encontrada" });
    }
    if (error.message === "EXERCISE_NOT_FOUND") {
      return res.status(404).json({ error: "Ejercicio no encontrado en la rutina" });
    }
    if (error.code?.startsWith("EXERCISE_PROVIDER_")) {
      const status = error.code === "EXERCISE_PROVIDER_RATE_LIMIT" ? 429 : 503;
      return res.status(status).json({
        error: "El catálogo de ejercicios no está disponible en este momento",
      });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

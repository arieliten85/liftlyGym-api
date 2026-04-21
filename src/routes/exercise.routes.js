const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/auth.middleware");
const exerciseController = require("../controllers/exercise.controller");

router.get("/all", authMiddleware, exerciseController.getAll);
router.get("/", authMiddleware, exerciseController.getByMuscle);
router.get("/by-muscles", authMiddleware, exerciseController.getByMuscles); // NUEVA RUTA
router.post("/", authMiddleware, exerciseController.createExercise);
router.patch("/:name/media", authMiddleware, exerciseController.updateExerciseMedia);

module.exports = router;
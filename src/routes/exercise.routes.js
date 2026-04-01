// routes/exercise.routes.js

const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/auth.middleware");
const exerciseController = require("../controllers/exercise.controller");

router.get("/all", authMiddleware, exerciseController.getAll);
router.get("/", authMiddleware, exerciseController.getByMuscle);
router.post("/", authMiddleware, exerciseController.createExercise);

module.exports = router;
const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/auth.middleware");
const exerciseController = require("../controllers/exercise.controller");

router.get("/all", authMiddleware, exerciseController.getAll);
router.get("/", authMiddleware, exerciseController.getByMuscle);
router.get("/by-muscles", authMiddleware, exerciseController.getByMuscles);
router.get("/:exerciseId", authMiddleware, exerciseController.getById);

module.exports = router;

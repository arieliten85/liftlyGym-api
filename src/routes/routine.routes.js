 const express = require("express");
const router  = express.Router();
const routineController = require("../controllers/routine.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

router.post("/generate",                    authMiddleware, routineController.generateRoutine);
router.post("/complete",                    authMiddleware, routineController.completeSession);
router.get("/",                             authMiddleware, routineController.getUserRoutines);
router.get("/:id/progress",                authMiddleware, routineController.getRoutineProgress);
router.delete("/:id",                      authMiddleware, routineController.deleteRoutine);
router.post("/:id/apply-adjustments",      authMiddleware, routineController.applyPendingAdjustments);
router.patch("/:id/replace-exercise",      authMiddleware, routineController.replaceExercise);
module.exports = router;
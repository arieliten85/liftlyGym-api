const express = require("express");
const router = express.Router();
const routineController = require("../controllers/routine.controller");

router.post("/generate", routineController.generateRoutine);

module.exports = router;

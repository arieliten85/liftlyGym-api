const routineService = require("../services/routine.service");

exports.generateRoutine = async (req, res) => {
  try {
    const payload = req.body;

    const routine = await routineService.generateRoutine(payload);

  

    res.json(routine);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

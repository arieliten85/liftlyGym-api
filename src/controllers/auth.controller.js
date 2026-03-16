const authService = require("../services/auth.service");

exports.register = async (req, res) => {
  try {
    const userData = req.body;

    const result = await authService.registerUser(userData);

    return res.status(201).json({
      message: "Usuario registrado (mock)",
      user: result,
    });

  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      message: "Error al registrar usuario",
    });
  }
};

const authService = require("../services/auth.service");

class AuthController {

  async register(req, res) {
    try {
      const user = await authService.registerUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      

      const result = await authService.loginUser(email, password);

        

      res.json(result);
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  }

}

module.exports = new AuthController();

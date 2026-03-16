const prisma = require("../lib/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

class AuthService {

  async registerUser(userData) {
    const { name, email, password } = userData;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error("El email ya está registrado");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // generar token también al registrarse
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return { token };
  }

  async loginUser(email, password) {
 console.log("------------->paso 1",  email)
    const user = await prisma.user.findUnique({
      where: { email },
    });


       console.log("------------->paso 2",  user)

    if (!user) {
      throw new Error("Usuario no encontrado");
    }
 console.log("------------->password",  password)
  console.log("------------->user.password",  user.password)
    const validPassword = await bcrypt.compare(password, user.password);
 

    if (!validPassword) {
      throw new Error("Contraseña incorrecta");
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return { token };
  }
}

module.exports = new AuthService();

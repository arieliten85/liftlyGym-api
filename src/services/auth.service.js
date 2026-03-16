class AuthService {
  async registerUser(userData) {
    const { name, email, password } = userData;

    /*
    Acá normalmente harías:

    - validar email
    - hashear password
    - guardar en DB
    */

    console.log("USUARIO A GUARDAR EN DB:");
    console.log({
      name,
      email,
      password,
    });

    return {
      name,
      email,
    };
  }
}

module.exports = new AuthService();

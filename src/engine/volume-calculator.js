function calcularVolumen(payload) {

  const nivel = payload.nivel;
  const objetivo = payload.objetivo;

  if (nivel === "principiante") {

    if (objetivo === "fuerza") return 3;
    if (objetivo === "hipertrofia") return 4;
    if (objetivo === "resistencia") return 4;

    return 4;
  }

  if (nivel === "intermedio") {

    if (objetivo === "fuerza") return 4;
    if (objetivo === "hipertrofia") return 5;
    if (objetivo === "resistencia") return 5;

    return 5;
  }

  if (nivel === "avanzado") {

    if (objetivo === "fuerza") return 5;
    if (objetivo === "hipertrofia") return 6;
    if (objetivo === "resistencia") return 6;

    return 6;
  }

  return 4;
}

module.exports = { calcularVolumen };

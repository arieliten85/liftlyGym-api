const { resolverMusculos } = require("./muscle-resolver");
const { calcularVolumen } = require("./volume-calculator");
const { seleccionarEjercicios } = require("./exercise-selector");

async function generarRutina(payload) {
  const musculos = resolverMusculos(payload);

  const volumen = calcularVolumen(payload);

  const exercises = await seleccionarEjercicios({
    musculos,
    equipamiento: payload.equipamiento,
    volumen,
  });

  return {
    exercises,
  };
}

module.exports = { generarRutina };

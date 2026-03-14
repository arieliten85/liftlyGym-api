const { resolverMusculos } = require("./muscle-resolver");
const { calcularVolumen } = require("./volume-calculator");
const { seleccionarEjercicios } = require("./exercise-selector");

function generarRutina(payload) {
  const musculos = resolverMusculos(payload);

  const volumen = calcularVolumen(payload);

  const exercises = seleccionarEjercicios({
    musculos,
    equipamiento: payload.equipamiento,
    volumen,
  });

  return {
    exercises,
  };
}

module.exports = { generarRutina };

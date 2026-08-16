const exerciseService = require("../services/exercise.service");

function esCompuesto(nombre) {
  const compuestos = ["press", "sentadilla", "peso_muerto", "dominadas", "remo", "prensa", "hip_thrust", "zancadas"];
  return compuestos.some((p) => nombre.includes(p));
}

async function seleccionarEjercicios({ musculos, equipamiento, volumen }) {
  const filtrados = await exerciseService.getByMuscles(musculos, [equipamiento]);

  if (filtrados.length === 0) {
    console.warn(`[engine] No exercises — musculos: ${musculos}, equipamiento: ${equipamiento}`);
    return [];
  }

  const compuestos = filtrados.filter((e) => esCompuesto(e.name));
  const rutina = [];

  if (compuestos.length) {
    rutina.push(compuestos[Math.floor(Math.random() * compuestos.length)]);
  }

  const restantes = filtrados
    .filter((e) => !rutina.find((r) => r.name === e.name))
    .sort(() => 0.5 - Math.random());

  for (const ejercicio of restantes) {
    if (rutina.length >= volumen) break;
    rutina.push(ejercicio);
  }

  return rutina;
}

module.exports = { seleccionarEjercicios };

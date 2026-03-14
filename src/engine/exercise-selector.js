const exercisesDB = require("../data/exercises.mock");

function esCompuesto(nombre) {
  const compuestos = [
    "press",
    "sentadilla",
    "peso_muerto",
    "dominadas",
    "remo",
    "prensa",
  ];

  return compuestos.some((p) => nombre.includes(nombre));
}

function seleccionarEjercicios({ musculos, equipamiento, volumen }) {
  const filtrados = exercisesDB.filter(
    (e) => musculos.includes(e.muscle) && e.equipment.includes(equipamiento),
  );

  if (filtrados.length === 0) {
    console.warn("No exercises found");
    return [];
  }

  const compuestos = filtrados.filter((e) => esCompuesto(e.name));
  const accesorios = filtrados.filter((e) => !esCompuesto(e.name));

  const rutina = [];

  if (compuestos.length) {
    const principal = compuestos[Math.floor(Math.random() * compuestos.length)];

    rutina.push(principal);
  }

  const restantes = [...filtrados]
    .filter((e) => !rutina.find((r) => r.name === e.name))
    .sort(() => 0.5 - Math.random());

  for (const ejercicio of restantes) {
    if (rutina.length >= volumen) break;

    rutina.push(ejercicio);
  }

  return rutina;
}

module.exports = { seleccionarEjercicios };

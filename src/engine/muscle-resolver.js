function resolverMusculos(payload) {
  const rutina = payload.rutina;

  const map = {
    push: ["pecho", "hombros", "triceps"],

    pull: ["espalda", "biceps"],

    legs: ["piernas", "gluteos"],

    pecho: ["pecho"],

    espalda: ["espalda"],

    biceps: ["biceps"],

    triceps: ["triceps"],

    hombros: ["hombros"],

    piernas: ["piernas"],
  };

  return map[rutina] || [];
}

module.exports = { resolverMusculos };

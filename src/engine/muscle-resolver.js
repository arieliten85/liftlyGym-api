function resolverMusculos(payload) {
  const rutina = payload.rutina;
  const map = {
    push:      ["chest", "shoulders", "triceps"],
    pull:      ["back", "biceps"],
    legs:      ["legs", "glutes"],
    upper:     ["chest", "back", "shoulders", "biceps", "triceps"],
    lower:     ["legs", "glutes"],
    fullbody:  ["chest", "back", "shoulders", "biceps", "triceps", "legs", "glutes", "core"],
    chest:     ["chest"],
    back:      ["back"],
    biceps:    ["biceps"],
    triceps:   ["triceps"],
    shoulders: ["shoulders"],
    legs:      ["legs"],
    glutes:    ["glutes"],
    core:      ["core"],
  };
  return map[rutina] || [];
}
module.exports = { resolverMusculos };
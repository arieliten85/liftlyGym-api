const test = require("node:test");
const assert = require("node:assert/strict");

const exerciseService = require("../src/services/exercise.service");
const { generarRutina } = require("../src/engine/routine.engine");

test("getByMuscles falls back to local catalog when ExerciseDB key is missing", async () => {
  const previousKey = process.env.EXERCISEDB_API_KEY;
  delete process.env.EXERCISEDB_API_KEY;

  try {
    const exercises = await exerciseService.getByMuscles(
      ["chest", "biceps"],
      "gym",
    );

    assert.ok(exercises.length > 0);
    assert.ok(exercises.every((exercise) => exercise.externalExerciseId));
    assert.ok(exercises.every((exercise) => exercise.source === "local-catalog"));
    assert.ok(
      exercises.every((exercise) => ["chest", "biceps"].includes(exercise.muscle)),
    );
  } finally {
    if (previousKey) process.env.EXERCISEDB_API_KEY = previousKey;
  }
});

test("quick routine engine can select exercises without ExerciseDB key", async () => {
  const previousKey = process.env.EXERCISEDB_API_KEY;
  delete process.env.EXERCISEDB_API_KEY;

  try {
    const routine = await generarRutina({
      modo: "quick",
      rutina: "push",
      objetivo: "hypertrophy",
      nivel: "beginner",
      equipamiento: "gym",
    });

    assert.ok(routine.exercises.length > 0);
    assert.ok(
      routine.exercises.every((exercise) => exercise.externalExerciseId),
    );
  } finally {
    if (previousKey) process.env.EXERCISEDB_API_KEY = previousKey;
  }
});

test("custom selector can resolve a local exercise by stable id", async () => {
  const exercise = await exerciseService.getById("local:bench_press");

  assert.equal(exercise.externalExerciseId, "local:bench_press");
  assert.equal(exercise.muscle, "chest");
  assert.equal(exercise.source, "local-catalog");
});

test("unsupported equipment does not broaden local custom results", async () => {
  const previousKey = process.env.EXERCISEDB_API_KEY;
  delete process.env.EXERCISEDB_API_KEY;

  try {
    const exercises = await exerciseService.getByMuscles(["chest"], "invalid");
    assert.deepEqual(exercises, []);
  } finally {
    if (previousKey) process.env.EXERCISEDB_API_KEY = previousKey;
  }
});

test("bands equipment uses local fallback instead of empty provider results", async () => {
  const previousKey = process.env.EXERCISEDB_API_KEY;
  delete process.env.EXERCISEDB_API_KEY;

  try {
    const exercises = await exerciseService.getByMuscles(["chest"], "bands");
    assert.ok(exercises.length > 0);
    assert.ok(exercises.every((exercise) => exercise.equipment.includes("bands")));
  } finally {
    if (previousKey) process.env.EXERCISEDB_API_KEY = previousKey;
  }
});

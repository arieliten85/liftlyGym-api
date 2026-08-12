const EXERCISEDB_API_URL =
  process.env.EXERCISEDB_API_URL ??
  "https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com/api/v1";
const EXERCISEDB_HOST =
  process.env.EXERCISEDB_HOST ??
  "edb-with-videos-and-images-by-ascendapi.p.rapidapi.com";
const REQUEST_TIMEOUT_MS = Number(
  process.env.EXERCISEDB_TIMEOUT_MS ?? 10000,
);
const MAX_CATALOG_EXERCISES = Number(
  process.env.EXERCISEDB_CATALOG_LIMIT ?? 200,
);
const PAGE_SIZE = 25;

const MUSCLE_TO_BODY_PARTS = {
  chest: ["Chest"],
  back: ["Back"],
  shoulders: ["Shoulders"],
  biceps: ["Upper Arms"],
  triceps: ["Upper Arms"],
  legs: ["Upper Legs", "Lower Legs"],
  glutes: ["Upper Legs"],
  core: ["Waist"],
};

const EQUIPMENT_TO_PROVIDER = {
  gym: ["Barbell", "Dumbbell", "Cable", "Machine", "Smith Machine"],
  dumbbells: ["Dumbbell"],
  basic: ["Barbell", "Dumbbell", "Resistance Band", "Body Weight"],
  bodyweight: ["Body Weight", "Resistance Band"],
  bands: ["Resistance Band"],
};

class ExerciseProviderError extends Error {
  constructor(code, status, message) {
    super(message);
    this.name = "ExerciseProviderError";
    this.code = code;
    this.status = status;
  }
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function resolveInternalMuscle(exercise, requestedMuscles = []) {
  const primarySearchable = normalizeText(
    [
      exercise.name,
      ...(exercise.bodyParts ?? []),
      ...(exercise.targetMuscles ?? []),
    ].join(" "),
  );
  const secondarySearchable = normalizeText(
    (exercise.secondaryMuscles ?? []).join(" "),
  );

  const rules = [
    ["biceps", ["bicep", "curl", "chin-up", "chin up"]],
    ["triceps", ["tricep", "pushdown", "skull crusher"]],
    ["glutes", ["glute", "hip"]],
    ["chest", ["chest", "pectoralis", "pectoral"]],
    ["back", ["back", "latissimus", "rhomboid", "trapezius", "lat "]],
    ["shoulders", ["shoulder", "deltoid"]],
    ["core", ["waist", "abdominal", "oblique", "core"]],
    [
      "legs",
      [
        "leg",
        "quadricep",
        "hamstring",
        "adductor",
        "calf",
        "gastrocnemius",
        "soleus",
      ],
    ],
  ];

  for (const [muscle, tokens] of rules) {
    if (tokens.some((token) => primarySearchable.includes(token))) {
      return requestedMuscles.length === 0 || requestedMuscles.includes(muscle)
        ? muscle
        : "other";
    }
  }

  for (const [muscle, tokens] of rules) {
    if (tokens.some((token) => secondarySearchable.includes(token))) {
      return requestedMuscles.length === 0 || requestedMuscles.includes(muscle)
        ? muscle
        : "other";
    }
  }

  return requestedMuscles[0] ?? "other";
}

function formatProviderEquipment(equipments = []) {
  return unique(
    equipments.map((equipment) =>
      String(equipment)
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase()),
    ),
  );
}

function normalizeExercise(exercise, requestedMuscles = []) {
  if (!exercise || typeof exercise !== "object") return null;
  if (!exercise.exerciseId || !exercise.name) return null;

  return {
    id: exercise.exerciseId,
    externalExerciseId: exercise.exerciseId,
    name: String(exercise.name).trim(),
    muscle: resolveInternalMuscle(exercise, requestedMuscles),
    equipment: formatProviderEquipment(exercise.equipments),
    imageUrl:
      exercise.imageUrls?.["480p"] ??
      exercise.imageUrls?.["360p"] ??
      exercise.imageUrl ??
      null,
    gifUrl: null,
    videoUrl: exercise.videoUrl ?? null,
    instructions: Array.isArray(exercise.instructions)
      ? exercise.instructions.filter((step) => typeof step === "string")
      : [],
    overview:
      typeof exercise.overview === "string" ? exercise.overview : null,
    exerciseTips: Array.isArray(exercise.exerciseTips)
      ? exercise.exerciseTips.filter((tip) => typeof tip === "string")
      : [],
    source: "exercisedb-v2",
  };
}

function providerErrorFromResponse(status, payload) {
  const providerCode = payload?.error?.code;

  if (status === 401 || status === 403) {
    return new ExerciseProviderError(
      "EXERCISE_PROVIDER_UNAUTHORIZED",
      status,
      "ExerciseDB rechazó las credenciales del servidor",
    );
  }
  if (status === 429) {
    return new ExerciseProviderError(
      "EXERCISE_PROVIDER_RATE_LIMIT",
      status,
      "ExerciseDB alcanzó el límite del plan",
    );
  }

  return new ExerciseProviderError(
    providerCode ?? "EXERCISE_PROVIDER_ERROR",
    status,
    "ExerciseDB no pudo responder la solicitud",
  );
}

async function request(pathname, query = {}) {
  const apiKey = process.env.EXERCISEDB_API_KEY;
  if (!apiKey) {
    throw new ExerciseProviderError(
      "EXERCISE_PROVIDER_NOT_CONFIGURED",
      503,
      "Falta configurar EXERCISEDB_API_KEY en el backend",
    );
  }

  const url = new URL(`${EXERCISEDB_API_URL}${pathname}`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": EXERCISEDB_HOST,
      },
      signal: controller.signal,
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      throw new ExerciseProviderError(
        "EXERCISE_PROVIDER_INVALID_RESPONSE",
        502,
        "ExerciseDB devolvió una respuesta inválida",
      );
    }

    if (!response.ok) throw providerErrorFromResponse(response.status, payload);
    if (payload?.success !== true) {
      throw new ExerciseProviderError(
        "EXERCISE_PROVIDER_INVALID_RESPONSE",
        502,
        "ExerciseDB devolvió una respuesta inesperada",
      );
    }

    return payload;
  } catch (error) {
    if (error instanceof ExerciseProviderError) throw error;
    if (error.name === "AbortError") {
      throw new ExerciseProviderError(
        "EXERCISE_PROVIDER_TIMEOUT",
        504,
        "ExerciseDB tardó demasiado en responder",
      );
    }
    throw new ExerciseProviderError(
      "EXERCISE_PROVIDER_UNAVAILABLE",
      502,
      "No se pudo conectar con ExerciseDB",
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function getProviderBodyParts(muscles) {
  return unique(muscles.flatMap((muscle) => MUSCLE_TO_BODY_PARTS[muscle] ?? []));
}

function getProviderEquipments(equipment) {
  if (!equipment) return [];
  return EQUIPMENT_TO_PROVIDER[normalizeText(equipment)] ?? null;
}

async function fetchFilteredExercises(muscles, equipment) {
  const providerEquipments = getProviderEquipments(equipment);
  if (providerEquipments === null) return [];

  const payload = await request("/exercises", {
    bodyParts: getProviderBodyParts(muscles).join(","),
    equipments: providerEquipments.join(","),
    exerciseType: "strength",
    limit: PAGE_SIZE,
  });

  if (!Array.isArray(payload.data)) {
    throw new ExerciseProviderError(
      "EXERCISE_PROVIDER_INVALID_RESPONSE",
      502,
      "ExerciseDB no devolvió una lista de ejercicios",
    );
  }

  return payload.data
    .map((exercise) => normalizeExercise(exercise, muscles))
    .filter(Boolean)
    .filter((exercise) => muscles.includes(exercise.muscle));
}

async function getByMuscles(muscles, equipment) {
  const requestedMuscles = unique(
    muscles.map((muscle) => normalizeText(muscle)).filter((muscle) =>
      Object.hasOwn(MUSCLE_TO_BODY_PARTS, muscle),
    ),
  );
  if (requestedMuscles.length === 0) return [];

  const combined = await fetchFilteredExercises(requestedMuscles, equipment);
  const missingMuscles = requestedMuscles.filter(
    (muscle) => !combined.some((exercise) => exercise.muscle === muscle),
  );

  const supplemental = [];
  const requestedBodyPartGroups = new Set();
  for (const muscle of missingMuscles) {
    const bodyPartKey = getProviderBodyParts([muscle]).join(",");
    if (!bodyPartKey || requestedBodyPartGroups.has(bodyPartKey)) continue;
    requestedBodyPartGroups.add(bodyPartKey);
    supplemental.push(...(await fetchFilteredExercises([muscle], equipment)));
  }

  const byId = new Map();
  for (const exercise of [...combined, ...supplemental]) {
    byId.set(exercise.externalExerciseId, exercise);
  }
  return [...byId.values()];
}

async function getByMuscle(muscle, equipment) {
  return getByMuscles([muscle], equipment);
}

async function getAll() {
  const exercises = [];
  let after;

  while (exercises.length < MAX_CATALOG_EXERCISES) {
    const payload = await request("/exercises", {
      exerciseType: "strength",
      limit: Math.min(PAGE_SIZE, MAX_CATALOG_EXERCISES - exercises.length),
      after,
    });
    const page = Array.isArray(payload.data) ? payload.data : [];
    exercises.push(
      ...page.map((exercise) => normalizeExercise(exercise)).filter(Boolean),
    );

    if (!payload.meta?.hasNextPage || !payload.meta?.nextCursor || page.length === 0) {
      break;
    }
    after = payload.meta.nextCursor;
  }

  return exercises.slice(0, MAX_CATALOG_EXERCISES);
}

async function getById(exerciseId) {
  if (!exerciseId || typeof exerciseId !== "string") {
    throw new ExerciseProviderError(
      "INVALID_EXERCISE_ID",
      400,
      "El identificador del ejercicio es inválido",
    );
  }

  const payload = await request(`/exercises/${encodeURIComponent(exerciseId)}`);
  const rawExercise = payload.data ?? payload;
  const exercise = normalizeExercise(rawExercise);
  if (!exercise) {
    throw new ExerciseProviderError(
      "EXERCISE_PROVIDER_INVALID_RESPONSE",
      502,
      "ExerciseDB devolvió un ejercicio inválido",
    );
  }
  return exercise;
}

async function getByIds(exerciseIds) {
  const ids = unique(exerciseIds);
  const results = [];

  for (let index = 0; index < ids.length; index += 4) {
    const batch = ids.slice(index, index + 4);
    const settled = await Promise.allSettled(batch.map((id) => getById(id)));
    for (const result of settled) {
      if (result.status === "fulfilled") results.push(result.value);
    }
  }

  return results;
}

module.exports = {
  ExerciseProviderError,
  getAll,
  getById,
  getByIds,
  getByMuscle,
  getByMuscles,
  normalizeExercise,
};

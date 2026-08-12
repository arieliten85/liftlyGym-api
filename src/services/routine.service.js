const aiService = require("../ai/openIA.service");
const { generarRutina } = require("../engine/routine.engine");
const exerciseService = require("./exercise.service");
const notificationService = require("./notification.service");
const prisma = require("../lib/prisma");

const {
  buildSessionSummary,
  buildPreviousValues,
} = require("../helpers/routine/session.helper");
const { shouldAdjustRoutine } = require("../helpers/routine/detection.helper");
const {
  classifyAdjustments,
  applyAdjustments,
  buildAdjustmentNotification,
} = require("../helpers/routine/adjustment.helper");
exports.generateRoutine = async (userId, payload) => {
  const { modo, objetivo, nivel, equipamiento, rutina } = payload;

  // quick: la IA genera la rutina desde el engine
  if (modo === "quick") {
    const rutinaBase = await generarRutina(payload);
    if (rutinaBase.exercises.length === 0) {
      throw new Error("EXERCISE_PROVIDER_EMPTY");
    }
    const rutinaConIA = await aiService.generateRoutine({
      ...payload,
      exercises: rutinaBase.exercises,
    });

    const exercises = rutinaConIA.routine.exercises
      .map((exercise) => {
        const catalogExercise = rutinaBase.exercises.find(
          (candidate) =>
            candidate.name.toLowerCase() === exercise.name.toLowerCase(),
        );
        if (!catalogExercise) return null;
        return {
          ...exercise,
          externalExerciseId: catalogExercise.externalExerciseId,
          muscle: catalogExercise.muscle,
          imageUrl: catalogExercise.imageUrl,
          videoUrl: catalogExercise.videoUrl,
          instructions: catalogExercise.instructions,
        };
      })
      .filter(Boolean);

    if (exercises.length === 0) {
      throw new Error("INVALID_AI_EXERCISES");
    }

    return await _saveRoutine(userId, {
      name: rutina ?? "Mi rutina",
      modo,
      objetivo,
      nivel,
      equipamiento,
      split: rutina ?? null,
      exercises,
    });
  }

  // custom: el usuario ya armó la rutina, solo guardamos
  const { customSubMode } = payload;

  if (customSubMode === "single") {
    // aplanamos ejerciciosPorMusculo en un array ordenado
    const exercises = Object.values(payload.ejerciciosPorMusculo).flat();
    return await _saveRoutine(userId, {
      name: rutina ?? "Mi rutina",
      modo,
      objetivo,
      nivel,
      equipamiento,
      split: null,
      exercises,
    });
  }

  if (customSubMode === "plan") {
    // una rutina por día, devolvemos array
    const routines = [];
    for (const dayPlan of payload.ejercicios) {
      const dayLabel = dayPlan.day.charAt(0).toUpperCase() + dayPlan.day.slice(1);
      const muscleLabel = payload.planSemanal
        .find((p) => p.day === dayPlan.day)
        ?.muscles?.join("/") ?? dayPlan.day;
      const name = `${muscleLabel.charAt(0).toUpperCase() + muscleLabel.slice(1)} - ${dayLabel}`;

      const saved = await _saveRoutine(userId, {
        name,
        modo,
        objetivo,
        nivel,
        equipamiento,
        split: muscleLabel,
        exercises: dayPlan.exercises,
      });
      routines.push(saved);
    }
    return routines;
  }

  throw new Error("INVALID_PAYLOAD");
};

// helper interno, no lo exportes
async function _saveRoutine(userId, { name, modo, objetivo, nivel, equipamiento, split, exercises }) {
  const savedRoutine = await prisma.routine.create({
    data: {
      userId,
      name,
      mode: modo,
      goal: objetivo,
      experience: nivel,
      equipment: equipamiento,
      split: split ?? null,
      exercises: {
        create: exercises.map((ex, index) => ({
          externalExerciseId: ex.externalExerciseId ?? ex.id ?? null,
          name: ex.name,
          muscle: ex.muscle ?? null,
          sets: ex.sets,
          reps: String(ex.reps),
          restSeconds: ex.restSeconds,
          weight: ex.weight ?? null,
          order: index,
          // ExerciseDB rotates media URLs weekly. Only its stable ID is persisted.
          imageUrl: null,
          gifUrl: null,
        })),
      },
    },
    include: { exercises: { orderBy: { order: "asc" } } },
  });

  return {
    ...savedRoutine,
    exercises: savedRoutine.exercises.map((savedExercise, index) => ({
      ...savedExercise,
      imageUrl: exercises[index]?.imageUrl ?? null,
      videoUrl: exercises[index]?.videoUrl ?? null,
      instructions: exercises[index]?.instructions ?? [],
    })),
  };
}
exports.completeSession = async (userId, payload) => {
  const {
    routineId,
    startedAt,
    completedAt,
    wasAbandoned,
    feedback,
    exercises: sessionExercises,
    wantsFasterAdjustments = false,
  } = payload;

  const routine = await prisma.routine.findFirst({
    where: { id: routineId, userId },
    include: { exercises: { orderBy: { order: "asc" } } },
  });
  if (!routine) throw new Error("NOT_FOUND");

  const session = await prisma.workoutSession.create({
    data: {
      routineId,
      startedAt: new Date(startedAt),
      completedAt: new Date(completedAt),
      wasAbandoned,
      intensity: feedback.intensity,
      energy: feedback.energy,
      painLevel: feedback.painLevel,
      comment: feedback.comment || null,
      exercises: {
        create: sessionExercises.map((ex) => {
          const completedLogs = ex.setLogs.filter((l) => !l.skipped);
          const skippedLogs = ex.setLogs.filter((l) => l.skipped);

          // solo pesos reales, ignoramos nulls y ceros
          const weightsWithValue = completedLogs
            .map((l) => l.weight)
            .filter((w) => w != null && w > 0);

          const maxWeight =
            weightsWithValue.length > 0 ? Math.max(...weightsWithValue) : null;

          // si no hubo peso registrado el volumen no tiene sentido, va null
          const totalVolume =
            completedLogs.reduce((acc, l) => {
              if (l.repsCompleted && l.weight)
                return acc + l.repsCompleted * l.weight;
              return acc;
            }, 0) || null;

          return {
            name: ex.name,
            setsCompleted: completedLogs.length,
            setsSkipped: skippedLogs.length,
            maxWeight,
            totalVolume,
            setLogs: {
              create: ex.setLogs.map((log) => ({
                setNumber: log.setNumber,
                repsCompleted: log.repsCompleted ?? null,
                weight: log.weight ?? null,
                skipped: log.skipped,
              })),
            },
          };
        }),
      },
    },
    include: { exercises: { include: { setLogs: true } } },
  });

  // si abandonó no tiene sentido ajustar nada, avisamos y listo
  if (wasAbandoned) {
    try {
      await notificationService.createNotification(userId, {
        title: "Sesión registrada",
        body: `Registramos tu sesión de "${routine.name}". Completá una sesión entera para activar los ajustes de la IA.`,
        type: "info",
        routineId,
      });
    } catch (error) {
      console.error(
        "[completeSession] Failed to create abandonment notification:",
        error.message,
      );
    }
    return { session, adjustments: null };
  }

  try {
    const summary = buildSessionSummary(routine.exercises, session.exercises);

    const sessionCount = await prisma.workoutSession.count({
      where: { routineId, wasAbandoned: false },
    });

    const shouldAdjust = await shouldAdjustRoutine(
      routine,
      sessionCount,
      summary,
      wantsFasterAdjustments,
    );

    if (!shouldAdjust) {
      return { session, adjustments: null };
    }

    // llegamos acá = hay algo para ajustar, le preguntamos a la IA
    const aiResult = await aiService.adjustRoutine({
      goal: routine.goal,
      experience: routine.experience,
      sessionCount,
      feedback,
      summary,
    });
    const adjustments = aiResult?.adjustments ?? [];

    const { minorAdjustments, majorAdjustments } =
      classifyAdjustments(adjustments);
    const previousValues = buildPreviousValues(routine.exercises, adjustments);

    const { title, body, adjustmentType } = buildAdjustmentNotification(
      adjustments,
      previousValues,
      summary,
      feedback,
      routine.name,
      majorAdjustments.length,
    );

    // guardamos los ajustes como pendientes, el usuario decide si los aplica
    const pendingAdjustments =
      adjustments.length > 0
        ? adjustments.map((adj) => ({
            ...adj,
            previous: previousValues[adj.name] ?? null,
            type: majorAdjustments.some((m) => m.name === adj.name)
              ? "major"
              : "minor",
          }))
        : null;

    await notificationService.createNotification(userId, {
      title,
      body,
      type: adjustments.length > 0 ? "success" : "info",
      routineId,
      pendingAdjustments,
      adjustmentType,
    });

    return { session, adjustments };
  } catch (error) {
    console.error(
      "[completeSession] Post-session adjustment failed:",
      error.message,
    );
    return { session, adjustments: null };
  }
};

exports.applyPendingAdjustments = async (userId, routineId, notificationId) => {
  const routine = await prisma.routine.findFirst({
    where: { id: routineId, userId },
  });
  if (!routine) throw new Error("NOT_FOUND");

  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId, routineId },
  });
  if (!notification || !notification.pendingAdjustments) {
    throw new Error("NO_PENDING_ADJUSTMENTS");
  }

  const adjustments = notification.pendingAdjustments;

  await applyAdjustments(routineId, adjustments);

  // limpiamos los pendientes para que no se apliquen dos veces
  await prisma.notification.update({
    where: { id: notificationId },
    data: { pendingAdjustments: null },
  });

  return { applied: adjustments.length };
};

exports.getUserRoutines = async (userId) => {
  const routines = await prisma.routine.findMany({
    where: { userId },
    include: { exercises: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const externalIds = routines.flatMap((routine) =>
    routine.exercises.map((exercise) => exercise.externalExerciseId),
  );

  let providerExercises = [];
  if (externalIds.some(Boolean)) {
    try {
      providerExercises = await exerciseService.getByIds(externalIds);
    } catch (error) {
      console.error(
        "[getUserRoutines] ExerciseDB media unavailable:",
        error.code ?? error.name,
      );
    }
  }
  const providerById = new Map(
    providerExercises.map((exercise) => [
      exercise.externalExerciseId,
      exercise,
    ]),
  );

  return routines.map((routine) => ({
    ...routine,
    exercises: routine.exercises.map((exercise) => {
      const providerExercise = providerById.get(exercise.externalExerciseId);
      if (!providerExercise) return exercise;
      return {
        ...exercise,
        imageUrl: providerExercise.imageUrl,
        videoUrl: providerExercise.videoUrl,
        instructions: providerExercise.instructions,
      };
    }),
  }));
};

exports.getRoutineProgress = async (userId, routineId) => {
  const routine = await prisma.routine.findFirst({
    where: { id: routineId, userId },
  });
  if (!routine) throw new Error("NOT_FOUND");

  const sessions = await prisma.workoutSession.findMany({
    where: { routineId, wasAbandoned: false },
    orderBy: { completedAt: "asc" },
    include: {
      exercises: {
        select: {
          name: true,
          setsCompleted: true,
          setsSkipped: true,
          maxWeight: true,
          totalVolume: true,
        },
      },
    },
  });

  // agrupamos el historial por ejercicio para graficar progreso
  const progressByExercise = {};
  for (const s of sessions) {
    for (const ex of s.exercises) {
      if (!progressByExercise[ex.name]) progressByExercise[ex.name] = [];
      progressByExercise[ex.name].push({
        date: s.completedAt,
        setsCompleted: ex.setsCompleted,
        setsSkipped: ex.setsSkipped,
        maxWeight: ex.maxWeight,
        totalVolume: ex.totalVolume,
      });
    }
  }

  return { routineId, routineName: routine.name, progress: progressByExercise };
};

exports.deleteRoutine = async (userId, routineId) => {
  const routine = await prisma.routine.findFirst({
    where: { id: routineId, userId },
  });
  if (!routine) throw new Error("NOT_FOUND");

  await prisma.routine.delete({ where: { id: routineId } });
  return true;
};

exports.replaceExercise = async (
  userId,
  routineId,
  exerciseName,
  newExternalExerciseId,
) => {
  const routine = await prisma.routine.findFirst({
    where: { id: routineId, userId },
  });
  if (!routine) throw new Error("NOT_FOUND");

  // Verificar que el ejercicio existe en la rutina ANTES de buscar en catálogo
  const existingExercise = await prisma.routineExercise.findFirst({
    where: { routineId, name: exerciseName },
  });

  if (!existingExercise) throw new Error("EXERCISE_NOT_FOUND");

  const providerExercise = await exerciseService.getById(
    newExternalExerciseId,
  );

  await prisma.routineExercise.updateMany({
    where: { routineId, name: exerciseName },
    data: {
      externalExerciseId: providerExercise.externalExerciseId,
      name: providerExercise.name,
      muscle: providerExercise.muscle,
      imageUrl: null,
      gifUrl: null,
    },
  });

  const updatedExercise = await prisma.routineExercise.findFirst({
    where: { routineId, name: providerExercise.name },
  });

  return {
    replaced: exerciseName,
    with: providerExercise.name,
    exercise: {
      ...updatedExercise,
      imageUrl: providerExercise.imageUrl,
      videoUrl: providerExercise.videoUrl,
      instructions: providerExercise.instructions,
    },
  };
};

exports.getStagnationAnalysis = async (userId, routineId) => {
  const routine = await prisma.routine.findFirst({
    where: { id: routineId, userId },
  });
  if (!routine) throw new Error("NOT_FOUND");

  const sessions = await prisma.workoutSession.findMany({
    where: { routineId, wasAbandoned: false },
    orderBy: { completedAt: "asc" },
    include: {
      exercises: {
        include: { setLogs: true },
      },
    },
  });

  if (sessions.length < 3) {
    return {
      hasStagnation: false,
      message: "Se necesitan más sesiones para analizar",
    };
  }

  // solo miramos las últimas 3, con más data se hace ruido
  const lastThreeSessions = sessions.slice(-3);
  const analysis = {};

  for (const session of lastThreeSessions) {
    for (const ex of session.exercises) {
      if (!analysis[ex.name]) {
        analysis[ex.name] = { sessions: [], progressTrend: "unknown" };
      }

      const completedLogs = ex.setLogs.filter((l) => !l.skipped);
      const avgWeight =
        completedLogs.length > 0
          ? completedLogs.reduce((sum, l) => sum + (l.weight || 0), 0) /
            completedLogs.length
          : 0;

      analysis[ex.name].sessions.push({
        date: session.completedAt,
        setsCompleted: ex.setsCompleted,
        avgWeight,
      });
    }
  }

  // si el peso de la tercera sesión supera al de la primera, hay progreso
  for (const [, data] of Object.entries(analysis)) {
    if (data.sessions.length >= 3) {
      const weights = data.sessions.map((s) => s.avgWeight);
      data.progressTrend = weights[2] > weights[0] ? "improving" : "stagnant";
    }
  }

  const stagnantExercises = Object.entries(analysis)
    .filter(([, data]) => data.progressTrend === "stagnant")
    .map(([name]) => name);

  return {
    hasStagnation: stagnantExercises.length > 0,
    stagnantExercises,
    analysis,
  };
};

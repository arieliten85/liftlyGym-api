const aiService = require("../ai/openIA.service");
const { generarRutina } = require("../engine/routine.engine");
const notificationService = require("./notification.service");
const { PrismaClient } = require("@prisma/client");

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

const prisma = new PrismaClient();

exports.generateRoutine = async (userId, payload) => {
  const { modo, objetivo, nivel, equipamiento, rutina, ejercicios } = payload;

  let exercises;

  // modo "quick" = la IA arma la rutina sola, sino usamos lo que mandó el user
  if (modo === "quick") {
    const rutinaBase = generarRutina(payload);
    const rutinaConIA = await aiService.generateRoutine({
      ...payload,
      exercises: rutinaBase.exercises,
    });
    exercises = rutinaConIA.routine.exercises;
  } else {
    exercises = ejercicios;
  }

  const routine = await prisma.routine.create({
    data: {
      userId,
      name: rutina ?? "Mi rutina",
      mode: modo,
      goal: objetivo,
      experience: nivel,
      equipment: equipamiento,
      split: rutina ?? null,
      exercises: {
        create: exercises.map((ex, index) => ({
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          restSeconds: ex.restSeconds,
          weight: ex.weight ?? null,
          order: index,
        })),
      },
    },
    include: { exercises: { orderBy: { order: "asc" } } },
  });

  return routine;
};

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
    await notificationService.createNotification(userId, {
      title: "Sesión registrada",
      body: `Registramos tu sesión de "${routine.name}". Completá una sesión entera para activar los ajustes de la IA.`,
      type: "info",
      routineId,
    });
    return { session, adjustments: null };
  }

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
  return await prisma.routine.findMany({
    where: { userId },
    include: { exercises: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
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

exports.replaceExercise = async (userId, routineId, exerciseName, newName) => {
  const routine = await prisma.routine.findFirst({
    where: { id: routineId, userId },
  });
  if (!routine) throw new Error("NOT_FOUND");

  const updated = await prisma.routineExercise.updateMany({
    where: { routineId, name: exerciseName },
    data: { name: newName },
  });

  if (updated.count === 0) throw new Error("EXERCISE_NOT_FOUND");

  return { replaced: exerciseName, with: newName };
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

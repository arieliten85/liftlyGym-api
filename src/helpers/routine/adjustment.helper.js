const { PrismaClient } = require("@prisma/client");
const { compareReps } = require("./math.helper");

const prisma = new PrismaClient();

// cambios de series o peso grande = mayor, el resto es menor
function classifyAdjustments(adjustments) {
  const majorAdjustments = [];
  const minorAdjustments = [];

  for (const adj of adjustments) {
    if (adj.sets !== undefined || (adj.weight !== undefined && Math.abs(adj.weight) >= 2.5)) {
      majorAdjustments.push(adj);
    } else {
      minorAdjustments.push(adj);
    }
  }

  return { majorAdjustments, minorAdjustments };
}

// aplica los ajustes uno por uno, solo los campos que cambiaron
async function applyAdjustments(routineId, adjustments) {
  for (const ex of adjustments) {
    const data = {};
    if (ex.sets !== undefined) data.sets = ex.sets;
    if (ex.reps !== undefined) data.reps = ex.reps;
    if (ex.weight !== undefined) data.weight = ex.weight;
    if (ex.restSeconds !== undefined) data.restSeconds = ex.restSeconds;
    if (Object.keys(data).length === 0) continue;

    await prisma.routineExercise.updateMany({
      where: { routineId, name: ex.name },
      data,
    });
  }
}

// arma el texto de la notificación con flechitas y motivos
function buildAdjustmentNotification(adjustments, previousValues, summary, feedback, routineName, majorCount) {
  if (adjustments.length === 0) {
    return {
      title: "Sesión completada ✅",
      body: `Completaste "${routineName}" sin cambios. Mantené el ritmo para que la IA detecte progreso.`,
      adjustmentType: "none",
    };
  }

  const lines = [];

  for (const adj of adjustments) {
    const prev = previousValues[adj.name];
    if (!prev) continue;

    const exSum = summary.find((s) => s.exercise === adj.name);
    const exName = adj.name.replace(/_/g, " ");
    const parts = [];

    if (adj.weight !== undefined) {
      const prevW = prev.weight ?? 0;
      const newW = adj.weight ?? 0;
      if (Math.abs(newW - prevW) >= 0.1) {
        const dir = newW > prevW ? "↑" : "↓";
        parts.push(`${dir} peso: ${prevW}kg → ${newW}kg${getMotivo("weight", newW > prevW, exSum, feedback)}`);
      }
    }

    if (adj.reps !== undefined && adj.reps !== prev.reps) {
      const dir = compareReps(adj.reps, prev.reps);
      parts.push(`${dir} reps: ${prev.reps} → ${adj.reps}${getMotivo("reps", dir !== "↓", exSum, feedback)}`);
    }

    if (adj.sets !== undefined && adj.sets !== prev.sets) {
      const dir = adj.sets > prev.sets ? "↑" : "↓";
      parts.push(`${dir} series: ${prev.sets} → ${adj.sets}${getMotivo("sets", adj.sets > prev.sets, exSum, feedback)}`);
    }

    if (adj.restSeconds !== undefined && adj.restSeconds !== prev.restSeconds) {
      const dir = adj.restSeconds > prev.restSeconds ? "↑" : "↓";
      parts.push(`${dir} descanso: ${prev.restSeconds}s → ${adj.restSeconds}s${getMotivo("rest", adj.restSeconds > prev.restSeconds, exSum, feedback)}`);
    }

    if (parts.length > 0) {
      lines.push(`• ${exName}: ${parts.join(", ")}`);
    }
  }

  if (lines.length === 0) {
    return {
      title: "Sesión completada ✅",
      body: `Completaste "${routineName}". La IA no detectó cambios necesarios por ahora.`,
      adjustmentType: "none",
    };
  }

  const adjustmentType = majorCount > 0 ? "major" : "minor";
  const title = adjustmentType === "major"
    ? "¡Ajustes importantes sugeridos! 💪"
    : "Rutina ajustada por la IA 🔧";

  return {
    title,
    body: `"${routineName}":\n${lines.join("\n")}`,
    adjustmentType,
  };
}

// devuelve un textito contextual según por qué se hizo el ajuste
function getMotivo(field, isIncrease, exSum, feedback) {
  const pain = feedback?.painLevel ?? 0;
  const energy = feedback?.energy ?? 3;

  if (!isIncrease && pain >= 4) return " (dolor reportado)";
  if (!exSum) return "";

  const { status, executed, planned } = exSum;
  const skipped = executed?.skippedSets ?? 0;
  const completed = executed?.completedSets ?? 0;
  const total = planned?.sets ?? 0;

  const highSkipRatio = total > 0 && skipped / total >= 0.25;

  if (field === "weight" || field === "reps") {
    if (isIncrease) {
      if (status === "completed") return " (completaste todas las series)";
      if (status === "partial" && completed >= total * 0.75) return " (completaste la mayoría)";
      return "";
    } else {
      if (status === "skipped") return " (ejercicio no realizado)";
      if (status === "partial" && highSkipRatio) return " (muchas series salteadas)";
      if (status === "partial") return " (series incompletas)";
      return "";
    }
  }

  if (field === "sets") {
    if (isIncrease) {
      if (status === "completed") return " (buen rendimiento)";
      return "";
    } else {
      if (status === "skipped") return " (ejercicio no realizado)";
      if (highSkipRatio) return " (salteaste muchas series)";
      if (skipped >= 1) return " (serie salteada)";
      return "";
    }
  }

  if (field === "rest") {
    if (!isIncrease) {
      if (status === "completed" && energy >= 3) return " (buena recuperación)";
      return "";
    } else {
      if (energy <= 2) return " (necesitás más recuperación)";
      if (pain >= 3) return " (molestias durante la sesión)";
      return "";
    }
  }

  return "";
}

module.exports = { classifyAdjustments, applyAdjustments, buildAdjustmentNotification };
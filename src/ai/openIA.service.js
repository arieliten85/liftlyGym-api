const OpenAI = require("openai");
require("dotenv").config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

const USE_MOCK = false;

// ─── MOCK GENERATE

const MOCK_GENERATE = {
  routine: {
    exercises: [
      { name: "dominadas", sets: 4, reps: "6-8", restSeconds: 120, weight: 0 },
      {
        name: "remo_barra",
        sets: 4,
        reps: "8-10",
        restSeconds: 90,
        weight: 30,
      },
      {
        name: "jalon_al_pecho",
        sets: 3,
        reps: "10-12",
        restSeconds: 90,
        weight: 75,
      },
      {
        name: "curl_barra",
        sets: 3,
        reps: "10-12",
        restSeconds: 60,
        weight: 30,
      },
    ],
  },
};

// ─── MOCK ADJUST
// Simula un caso realista:
// - dominadas: completó todo → sube reps
// - remo_barra: salteó series → baja series
// - jalon_al_pecho: completó todo → sube peso
// - curl_barra: sin cambios (no hay suficiente data todavía)
const MOCK_ADJUST = {
  adjustments: [
    { name: "dominadas", reps: "8-10" },
    { name: "remo_barra", sets: 3 },
    { name: "jalon_al_pecho", weight: 77.5 },
  ],
};

class AIService {
  async generateRoutine(userData) {
    if (USE_MOCK) {
      console.log("[AI] MOCK generateRoutine");
      return MOCK_GENERATE;
    }

    const prompt = `
Actúa como un entrenador personal profesional experto en gimnasio.
Analiza los datos del usuario y genera una rutina optimizada con pesos base reales.

Datos del usuario:
${JSON.stringify(userData, null, 2)}

Reglas para los pesos (weight):
- Asigna un peso base REALISTA en kg según el ejercicio y nivel de experiencia
- principiante: pesos ligeros/moderados (ej: press banca 30-40kg, curl 8-12kg)
- intermedio: pesos moderados (ej: press banca 60-80kg, curl 15-20kg)
- avanzado: pesos altos (ej: press banca 90-120kg, curl 22-30kg)
- Ejercicios corporales (dominadas, fondos): weight = 0
- Ejercicios de aislamiento: siempre menos peso que compuestos

Reglas generales:
- Usa SOLO los ejercicios proporcionados en userData.exercises
- Adapta intensidad según experiencia

Devuelve SOLO JSON válido sin texto adicional.
Formato exacto:
{
  "routine": {
    "exercises": [
      { "name": "string", "sets": 3, "reps": "10-12", "restSeconds": 90, "weight": 40 }
    ]
  }
}`;

    return this._callAI(prompt);
  }

  async adjustRoutine({ goal, experience, sessionCount, feedback, summary }) {
    if (USE_MOCK) {
      console.log("[AI] MOCK adjustRoutine");
      return MOCK_ADJUST;
    }

    //     const prompt = `
    // Sos un entrenador personal experto en progresión de carga.
    // El usuario completó una sesión. Analizá el resumen y ajustá su rutina para la próxima.

    // Contexto:
    // - Objetivo: ${goal}
    // - Nivel: ${experience}
    // - Sesiones completadas con esta rutina: ${sessionCount}

    // Feedback subjetivo (escala 1-5):
    // - Intensidad percibida: ${feedback.intensity ?? "no indicado"}
    // - Energía al terminar: ${feedback.energy ?? "no indicado"}
    // - Dolor/molestia: ${feedback.painLevel ?? "no indicado"}
    // - Comentario: ${feedback.comment || "ninguno"}

    // Resumen planificado vs ejecutado:
    // ${JSON.stringify(summary, null, 2)}

    // Reglas de ajuste:
    // 1. Si completó TODAS las series con el peso planificado e intensidad ≤ 3 → subí peso (2.5-5kg) o reps
    // 2. Si no completó todas las series o intensidad ≥ 4 → mantené o bajá ligeramente
    // 3. Si dolor ≥ 4 → reducí carga del ejercicio afectado
    // 4. Si hay series salteadas sistemáticamente → reducí sets
    // 5. NUNCA cambies el nombre de los ejercicios
    // 6. Solo incluí ejercicios que realmente necesitan cambio
    // 7. Campos permitidos: sets (Int), reps (String "x-y"), weight (Float), restSeconds (Int)
    // 8. Si no hay nada que ajustar devolvé adjustments vacío

    // Devuelve SOLO JSON válido sin texto adicional.
    // Formato exacto:
    // {
    //   "adjustments": [
    //     { "name": "nombre_ejercicio", "weight": 32.5 }
    //   ]
    // }`;
    const prompt = `
Actúa como un entrenador personal profesional experto en gimnasio.
Analiza los datos del usuario y genera una rutina optimizada con pesos base reales.

Datos del usuario:
${JSON.stringify(userData, null, 2)}

Reglas para los pesos (weight):
- Asigna un peso base REALISTA en kg según el ejercicio y nivel de experiencia
- principiante: pesos ligeros/moderados (ej: press banca 30-40kg, curl 8-12kg)
- intermedio: pesos moderados (ej: press banca 60-80kg, curl 15-20kg)
- avanzado: pesos altos (ej: press banca 90-120kg, curl 22-30kg)
- Ejercicios corporales (dominadas, fondos): weight = 0
- Ejercicios de aislamiento: siempre menos peso que compuestos

Reglas generales:
- Usa EXACTAMENTE los mismos ejercicios proporcionados en userData.exercises, ni uno más ni uno menos
- NUNCA agregues ni elimines ejercicios de la lista
- NUNCA cambies el nombre de los ejercicios
- El array de exercises del resultado debe tener EXACTAMENTE la misma cantidad que userData.exercises
- Adapta intensidad según experiencia

Devuelve SOLO JSON válido sin texto adicional.
Formato exacto:
{
  "routine": {
    "exercises": [
      { "name": "string", "sets": 3, "reps": "10-12", "restSeconds": 90, "weight": 40 }
    ]
  }
}`;
    return this._callAI(prompt);
  }

  async _callAI(prompt) {
    try {
      const response = await client.chat.completions.create({
        model: "openrouter/auto",
        messages: [
          {
            role: "system",
            content:
              "Devuelves SOLO JSON válido, sin texto adicional ni backticks.",
          },
          { role: "user", content: prompt },
        ],
      });

      const text = response.choices[0].message.content.trim();
      const clean = text.replace(/```json|```/g, "").trim();
      return JSON.parse(clean);
    } catch (error) {
      console.error("[AI] Error:", error.message);
      if (error.status === 429)
        throw new Error("Límite de IA alcanzado. Intentá en un momento.");
      throw new Error("Error en el servicio de IA: " + error.message);
    }
  }
}

module.exports = new AIService();

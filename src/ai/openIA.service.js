const OpenAI = require("openai");
require("dotenv").config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

const USE_MOCK = true;

const MOCK_RESPONSE = {
  routine: {
    exercises: [
      { name: "dominadas", reps: "6-8", restSeconds: 120, sets: 4, weight: 80 },
      {
        name: "remo_barra",
        reps: "8-10",
        restSeconds: 90,
        sets: 4,
        weight: 30,
      },
      {
        name: "jalon_al_pecho",
        reps: "10-12",
        restSeconds: 90,
        sets: 3,
        weight: 75,
      },
      {
        name: "curl_barra",
        reps: "10-12",
        restSeconds: 60,
        sets: 3,
        weight: 30,
      },
    ],
  },
};

class GeminiService {
  async generateRoutine(userData) {
    if (USE_MOCK) {
      console.log("MOCK activo - no se consume tokens");
      return MOCK_RESPONSE;
    }

    const prompt = `
Actúa como un entrenador personal profesional experto en gimnasio.

Analiza los datos del usuario y genera una rutina optimizada con pesos base reales.

Datos del usuario:
${JSON.stringify(userData)}

Reglas para los pesos (weight):
- Asigna un peso base REALISTA en kg según el ejercicio y nivel de experiencia
- principiante: pesos ligeros/moderados (ej: press banca 30-40kg, curl 8-12kg)
- intermedio: pesos moderados (ej: press banca 60-80kg, curl 15-20kg)
- avanzado: pesos altos (ej: press banca 90-120kg, curl 22-30kg)
- Ejercicios con mancuernas: usa el peso de UNA mancuerna
- Ejercicios corporales (fondos, dominadas): weight = 0
- Ejercicios de aislamiento: siempre menos peso que compuestos

Reglas generales:
- Usa SOLO los ejercicios proporcionados
- Prioriza ejercicios compuestos
- Adapta intensidad según experiencia
- Los pesos son orientativos, el usuario puede ajustarlos

Devuelve SOLO JSON sin texto adicional.

Formato:
{
  "routine": {
    "exercises": [
      {
        "name": "exercise",
        "sets": 3,
        "reps": "10-12",
        "restSeconds": 90,
        "weight": 40
      }
    ]
  }
}
`;

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
      console.error("AI error:", error.message);

      if (error.status === 429) {
        throw new Error("Límite alcanzado. Esperá un momento.");
      }

      throw new Error("Error generating AI routine: " + error.message);
    }
  }
}

module.exports = new GeminiService();

// const { PrismaClient } = require("@prisma/client");
// const prisma = new PrismaClient();

// // Acá vas agregando las URLs a medida que subís a Cloudinary
// // Los que no tienen imagen quedan en null automáticamente
 
// const CLOUDINARY_BASE = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/ejercicios`;

// const imageMap = {
//   dominadas: {
//     imageUrl: `${CLOUDINARY_BASE}/dominadas.png`,
//     gifUrl: null, // cuando tengas el gif: `${CLOUDINARY_BASE}/dominadas.gif`
//   },
//   // Vas agregando acá a medida que subís imágenes:
//   // press_banca: {
//   //   imageUrl: `${CLOUDINARY_BASE}/press_banca.jpg`,
//   //   gifUrl: `${CLOUDINARY_BASE}/press_banca.gif`,
//   // },
// };

// const exercises = [
//   { name: "press_banca",                   muscle: "chest",     equipment: ["gym"] },
//   { name: "press_inclinado_barra",         muscle: "chest",     equipment: ["gym"] },
//   { name: "press_declinado_barra",         muscle: "chest",     equipment: ["gym"] },
//   { name: "aperturas_polea",               muscle: "chest",     equipment: ["gym"] },
//   { name: "crossover_polea",               muscle: "chest",     equipment: ["gym"] },
//   { name: "press_mancuernas",              muscle: "chest",     equipment: ["dumbbells"] },
//   { name: "press_inclinado_mancuernas",    muscle: "chest",     equipment: ["dumbbells"] },
//   { name: "press_declinado_mancuernas",    muscle: "chest",     equipment: ["dumbbells"] },
//   { name: "aperturas_mancuernas",          muscle: "chest",     equipment: ["dumbbells"] },
//   { name: "pullover_mancuerna",            muscle: "chest",     equipment: ["dumbbells"] },
//   { name: "flexiones",                     muscle: "chest",     equipment: ["bodyweight"] },
//   { name: "flexiones_diamante",            muscle: "chest",     equipment: ["bodyweight"] },
//   { name: "flexiones_inclinadas",          muscle: "chest",     equipment: ["bodyweight"] },
//   { name: "flexiones_declinadas",          muscle: "chest",     equipment: ["bodyweight"] },
//   { name: "flexiones_archer",              muscle: "chest",     equipment: ["bodyweight"] },
//   { name: "press_bandas",                  muscle: "chest",     equipment: ["bands"] },
//   { name: "aperturas_bandas",              muscle: "chest",     equipment: ["bands"] },
//   { name: "press_inclinado_bandas",        muscle: "chest",     equipment: ["bands"] },
//   { name: "crossover_bandas",              muscle: "chest",     equipment: ["bands"] },
//   { name: "dominadas",                     muscle: "back",      equipment: ["bodyweight", "gym"] },
//   { name: "dominadas_supinas",             muscle: "back",      equipment: ["bodyweight", "gym"] },
//   { name: "remo_barra",                    muscle: "back",      equipment: ["gym"] },
//   { name: "jalon_al_pecho",               muscle: "back",      equipment: ["gym"] },
//   { name: "jalon_agarre_estrecho",         muscle: "back",      equipment: ["gym"] },
//   { name: "remo_en_polea",                 muscle: "back",      equipment: ["gym"] },
//   { name: "peso_muerto",                   muscle: "back",      equipment: ["gym"] },
//   { name: "remo_mancuernas",               muscle: "back",      equipment: ["dumbbells"] },
//   { name: "pullover_mancuerna_espalda",    muscle: "back",      equipment: ["dumbbells"] },
//   { name: "remo_mancuerna_un_brazo",       muscle: "back",      equipment: ["dumbbells"] },
//   { name: "remo_bandas",                   muscle: "back",      equipment: ["bands"] },
//   { name: "jalon_bandas",                  muscle: "back",      equipment: ["bands"] },
//   { name: "remo_bandas_un_brazo",          muscle: "back",      equipment: ["bands"] },
//   { name: "superman",                      muscle: "back",      equipment: ["bodyweight"] },
//   { name: "remo_invertido",                muscle: "back",      equipment: ["bodyweight"] },
//   { name: "bird_dog",                      muscle: "back",      equipment: ["bodyweight"] },
//   { name: "press_militar",                 muscle: "shoulders", equipment: ["gym"] },
//   { name: "press_arnold_barra",            muscle: "shoulders", equipment: ["gym"] },
//   { name: "elevaciones_laterales_polea",   muscle: "shoulders", equipment: ["gym"] },
//   { name: "remo_al_menton",               muscle: "shoulders", equipment: ["gym"] },
//   { name: "press_hombro_mancuernas",       muscle: "shoulders", equipment: ["dumbbells"] },
//   { name: "press_arnold",                  muscle: "shoulders", equipment: ["dumbbells"] },
//   { name: "elevaciones_laterales",         muscle: "shoulders", equipment: ["dumbbells"] },
//   { name: "elevaciones_frontales",         muscle: "shoulders", equipment: ["dumbbells"] },
//   { name: "pajaros",                       muscle: "shoulders", equipment: ["dumbbells"] },
//   { name: "elevaciones_bandas",            muscle: "shoulders", equipment: ["bands"] },
//   { name: "press_hombro_bandas",           muscle: "shoulders", equipment: ["bands"] },
//   { name: "elevaciones_frontales_bandas",  muscle: "shoulders", equipment: ["bands"] },
//   { name: "face_pull_bandas",              muscle: "shoulders", equipment: ["bands"] },
//   { name: "pike_pushups",                  muscle: "shoulders", equipment: ["bodyweight"] },
//   { name: "handstand_pushups",             muscle: "shoulders", equipment: ["bodyweight"] },
//   { name: "elevaciones_laterales_piso",    muscle: "shoulders", equipment: ["bodyweight"] },
//   { name: "curl_barra",                    muscle: "biceps",    equipment: ["gym"] },
//   { name: "curl_barra_z",                  muscle: "biceps",    equipment: ["gym"] },
//   { name: "curl_predicador",               muscle: "biceps",    equipment: ["gym"] },
//   { name: "curl_polea_baja",               muscle: "biceps",    equipment: ["gym"] },
//   { name: "curl_mancuernas",               muscle: "biceps",    equipment: ["dumbbells"] },
//   { name: "curl_martillo",                 muscle: "biceps",    equipment: ["dumbbells"] },
//   { name: "curl_concentrado",              muscle: "biceps",    equipment: ["dumbbells"] },
//   { name: "curl_inclinado_mancuernas",     muscle: "biceps",    equipment: ["dumbbells"] },
//   { name: "curl_bandas",                   muscle: "biceps",    equipment: ["bands"] },
//   { name: "curl_martillo_bandas",          muscle: "biceps",    equipment: ["bands"] },
//   { name: "curl_predicador_bandas",        muscle: "biceps",    equipment: ["bands"] },
//   { name: "chinups",                       muscle: "biceps",    equipment: ["bodyweight"] },
//   { name: "chinups_agarre_estrecho",       muscle: "biceps",    equipment: ["bodyweight"] },
//   { name: "curl_towel",                    muscle: "biceps",    equipment: ["bodyweight"] },
//   { name: "fondos_triceps",                muscle: "triceps",   equipment: ["bodyweight", "gym"] },
//   { name: "extension_triceps_polea",       muscle: "triceps",   equipment: ["gym"] },
//   { name: "press_frances",                 muscle: "triceps",   equipment: ["gym"] },
//   { name: "extension_triceps_polea_inv",   muscle: "triceps",   equipment: ["gym"] },
//   { name: "extension_triceps_mancuerna",   muscle: "triceps",   equipment: ["dumbbells"] },
//   { name: "patada_triceps",                muscle: "triceps",   equipment: ["dumbbells"] },
//   { name: "press_frances_mancuernas",      muscle: "triceps",   equipment: ["dumbbells"] },
//   { name: "extension_triceps_bandas",      muscle: "triceps",   equipment: ["bands"] },
//   { name: "patada_triceps_bandas",         muscle: "triceps",   equipment: ["bands"] },
//   { name: "press_frances_bandas",          muscle: "triceps",   equipment: ["bands"] },
//   { name: "flexiones_diamante_triceps",    muscle: "triceps",   equipment: ["bodyweight"] },
//   { name: "dips_banco",                    muscle: "triceps",   equipment: ["bodyweight"] },
//   { name: "flexiones_cerradas",            muscle: "triceps",   equipment: ["bodyweight"] },
//   { name: "sentadilla",                    muscle: "legs",      equipment: ["gym", "bodyweight"] },
//   { name: "prensa",                        muscle: "legs",      equipment: ["gym"] },
//   { name: "extension_cuadriceps",          muscle: "legs",      equipment: ["gym"] },
//   { name: "curl_femoral",                  muscle: "legs",      equipment: ["gym"] },
//   { name: "peso_muerto_rumano",            muscle: "legs",      equipment: ["gym", "dumbbells"] },
//   { name: "elevacion_talones",             muscle: "legs",      equipment: ["bodyweight", "gym"] },
//   { name: "sentadilla_hack",               muscle: "legs",      equipment: ["gym"] },
//   { name: "sentadilla_goblet",             muscle: "legs",      equipment: ["dumbbells"] },
//   { name: "zancadas",                      muscle: "legs",      equipment: ["dumbbells", "bodyweight"] },
//   { name: "zancadas_caminando",            muscle: "legs",      equipment: ["dumbbells", "bodyweight"] },
//   { name: "sentadilla_sumo_mancuerna",     muscle: "legs",      equipment: ["dumbbells"] },
//   { name: "elevacion_talones_mancuerna",   muscle: "legs",      equipment: ["dumbbells"] },
//   { name: "sentadilla_bandas",             muscle: "legs",      equipment: ["bands"] },
//   { name: "curl_femoral_bandas",           muscle: "legs",      equipment: ["bands"] },
//   { name: "extension_cuadriceps_bandas",   muscle: "legs",      equipment: ["bands"] },
//   { name: "zancadas_bandas",               muscle: "legs",      equipment: ["bands"] },
//   { name: "sentadilla_bulgara",            muscle: "legs",      equipment: ["bodyweight"] },
//   { name: "pistol_squat",                  muscle: "legs",      equipment: ["bodyweight"] },
//   { name: "step_up",                       muscle: "legs",      equipment: ["bodyweight"] },
//   { name: "hip_thrust",                    muscle: "glutes",    equipment: ["gym"] },
//   { name: "hip_thrust_barra",              muscle: "glutes",    equipment: ["gym"] },
//   { name: "patada_gluteo_polea",           muscle: "glutes",    equipment: ["gym"] },
//   { name: "abduccion_polea",               muscle: "glutes",    equipment: ["gym"] },
//   { name: "hip_thrust_mancuerna",          muscle: "glutes",    equipment: ["dumbbells"] },
//   { name: "peso_muerto_rumano_gluteos",    muscle: "glutes",    equipment: ["dumbbells"] },
//   { name: "zancadas_gluteo_mancuernas",    muscle: "glutes",    equipment: ["dumbbells"] },
//   { name: "puente_gluteos",                muscle: "glutes",    equipment: ["bodyweight"] },
//   { name: "puente_gluteos_una_pierna",     muscle: "glutes",    equipment: ["bodyweight"] },
//   { name: "sentadilla_sumo",              muscle: "glutes",    equipment: ["bodyweight"] },
//   { name: "patada_gluteo_cuadrupedia",     muscle: "glutes",    equipment: ["bodyweight"] },
//   { name: "patada_gluteo_bandas",          muscle: "glutes",    equipment: ["bands"] },
//   { name: "abduccion_bandas",              muscle: "glutes",    equipment: ["bands"] },
//   { name: "hip_thrust_bandas",             muscle: "glutes",    equipment: ["bands"] },
//   { name: "monster_walk",                  muscle: "glutes",    equipment: ["bands"] },
//   { name: "crunch_abdominal",              muscle: "core",      equipment: ["bodyweight"] },
//   { name: "plancha",                       muscle: "core",      equipment: ["bodyweight"] },
//   { name: "elevaciones_piernas",           muscle: "core",      equipment: ["bodyweight"] },
//   { name: "rueda_abdominal",               muscle: "core",      equipment: ["bodyweight"] },
//   { name: "mountain_climber",              muscle: "core",      equipment: ["bodyweight"] },
//   { name: "hollow_body",                   muscle: "core",      equipment: ["bodyweight"] },
//   { name: "sit_ups",                       muscle: "core",      equipment: ["bodyweight"] },
//   { name: "plancha_lateral",               muscle: "core",      equipment: ["bodyweight"] },
//   { name: "crunch_bandas",                 muscle: "core",      equipment: ["bands"] },
//   { name: "plancha_con_fila_bandas",       muscle: "core",      equipment: ["bands"] },
//   { name: "rotacion_con_bandas",           muscle: "core",      equipment: ["bands"] },
//   { name: "crunch_polea",                  muscle: "core",      equipment: ["gym"] },
//   { name: "elevaciones_piernas_barra",     muscle: "core",      equipment: ["gym"] },
//   { name: "rotacion_russa_con_disco",      muscle: "core",      equipment: ["gym"] },
// ];

// async function main() {
//   console.log("Seeding exercises...");

//   for (const ex of exercises) {
//     const media = imageMap[ex.name] ?? { imageUrl: null, gifUrl: null };
//     await prisma.exercise.upsert({
//       where: { name: ex.name },
//       update: {
//         muscle: ex.muscle,
//         equipment: ex.equipment,
//         imageUrl: media.imageUrl,
//         gifUrl: media.gifUrl,
//       },
//       create: {
//         name: ex.name,
//         muscle: ex.muscle,
//         equipment: ex.equipment,
//         imageUrl: media.imageUrl,
//         gifUrl: media.gifUrl,
//       },
//     });
//   }

//   console.log(`✅ ${exercises.length} ejercicios cargados`);
// }

// main()
//   .catch((e) => { console.error(e); process.exit(1); })
//   .finally(() => prisma.$disconnect());
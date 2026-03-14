const aiService = require("../ai/openIA.service");
const { generarRutina } = require("../engine/routine.engine");

exports.generateRoutine = async (payload) => {
    
  const rutinaBase = generarRutina(payload);


  

  const rutinaConIA = await aiService.generateRoutine({
    ...payload,
    exercises: rutinaBase.exercises,
  });

  return rutinaConIA;
};

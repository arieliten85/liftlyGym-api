const { PrismaClient } = require("@prisma/client");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");
const exercisesDB = require("../src/data/exercises.mock");
const prisma = new PrismaClient();

require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const IMAGE_FOLDER = path.join(__dirname, "../assets/images");
const GIF_FOLDER = path.join(__dirname, "../assets/gifs");

async function uploadIfExists(filePath, options) {
  if (!fs.existsSync(filePath)) return null;
  const result = await cloudinary.uploader.upload(filePath, options);
  return result.secure_url;
}

async function main() {
  console.log(`Procesando ${exercisesDB.length} ejercicios...`);

  for (const ex of exercisesDB) {
    try {
      // Buscar imagen por name Y por slug (por si el archivo tiene nombre distinto)
      const imagePaths = [
        path.join(IMAGE_FOLDER, `${ex.name}.png`),
        path.join(IMAGE_FOLDER, `${ex.slug}.png`),
      ];
      const gifPaths = [
        path.join(GIF_FOLDER, `${ex.name}.gif`),
        path.join(GIF_FOLDER, `${ex.slug}.gif`),
      ];

      const imageFile = imagePaths.find((p) => fs.existsSync(p)) ?? null;
      const gifFile = gifPaths.find((p) => fs.existsSync(p)) ?? null;

      const imageUrl = imageFile
        ? await cloudinary.uploader
            .upload(imageFile, {
              folder: "ejercicios/images",
              public_id: ex.name, // siempre usar el name como ID en Cloudinary
              overwrite: true,
            })
            .then((r) => r.secure_url)
        : null;

      const gifUrl = gifFile
        ? await cloudinary.uploader
            .upload(gifFile, {
              folder: "ejercicios/gifs",
              public_id: ex.name,
              overwrite: true,
              resource_type: "image", // Cloudinary trata gifs como image
            })
            .then((r) => r.secure_url)
        : null;

      await prisma.exercise.upsert({
        where: { name: ex.name },
        update: {
          muscle: ex.muscle,
          equipment: ex.equipment,
          ...(imageUrl && { imageUrl }),   // solo pisa si encontró archivo
          ...(gifUrl && { gifUrl }),
        },
        create: {
          name: ex.name,
          muscle: ex.muscle,
          equipment: ex.equipment,
          imageUrl,
          gifUrl,
        },
      });

      const status = imageUrl ? "✓ imagen" : "— sin imagen";
      const gifStatus = gifUrl ? "+ gif" : "";
      console.log(`${ex.name} ${status} ${gifStatus}`);
    } catch (err) {
      console.error(`✗ Error en ${ex.name}:`, err.message);
    }
  }

  console.log("\nSEED COMPLETO");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
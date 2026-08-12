# LiftlyGym API

## Catálogo externo de ejercicios

La aplicación consume el catálogo de **ExerciseDB V2 de AscendAPI** a través de RapidAPI. Las credenciales viven exclusivamente en este backend; el frontend nunca debe llamar a RapidAPI directamente ni contener una clave.

### Configuración local

1. Suscribirse al plan de ExerciseDB V2 en RapidAPI.
2. Copiar `.env.example` como `.env` si el entorno local todavía no está configurado.
3. Completar `EXERCISEDB_API_KEY` con la clave de RapidAPI.
4. Aplicar la migración de Prisma antes de iniciar una versión nueva de la API:

```bash
npx prisma migrate deploy
npx prisma generate
```

5. Iniciar el backend con `npm run dev`.

No es necesario configurar ninguna variable de ExerciseDB en Expo.

### Decisiones de integración

- El backend es el único cliente de ExerciseDB y normaliza las respuestas al contrato interno de LiftlyGym.
- Las rutinas guardan `externalExerciseId`, el identificador estable del proveedor.
- Las URLs de imágenes y videos no se persisten: ExerciseDB las rota semanalmente y se solicitan nuevamente cuando la app necesita mostrarlas.
- No hay caché de respuestas del proveedor. Solo debe agregarse una si el plan contratado autoriza explícitamente el almacenamiento en caché.
- Si ExerciseDB no responde, alcanza el límite o no está configurado, los endpoints del catálogo devuelven un error controlado; las rutinas antiguas siguen disponibles con sus fallbacks locales.
- La selección rápida y la selección manual usan el mismo catálogo externo.

### Límites conocidos del plan gratuito

- El plan Basic gratuito ofrece 200 ejercicios y 2.000 solicitudes mensuales.
- Las imágenes y videos gratuitos incluyen marca de agua.
- Los nombres e instrucciones llegan en inglés porque la traducción oficial al español todavía está en desarrollo.
- El plan gratuito es adecuado para desarrollo y validación inicial. Antes de producción hay que medir el consumo real y revisar los permisos de caché y uso comercial del plan vigente.

### Endpoints internos

- `GET /api/exercises?muscle=chest&equipment=gym`
- `GET /api/exercises/by-muscles?muscles=chest,triceps&equipment=dumbbells`
- `GET /api/exercises/all`
- `GET /api/exercises/:exerciseId`

Todos requieren autenticación de LiftlyGym. Ningún endpoint expone la clave de RapidAPI.

### Fuentes oficiales

- https://docs.ascendapi.com/products/edb-v2/overview
- https://docs.ascendapi.com/quickstart/overview
- https://docs.ascendapi.com/guides/caching
- https://docs.ascendapi.com/guides/translations

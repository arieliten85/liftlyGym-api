const LIFT_API_BASE_URL =
  process.env.LIFT_API_BASE_URL || "https://lift-api-hlaf.onrender.com";
const LIFT_API_TIMEOUT_MS = Number(process.env.LIFT_API_TIMEOUT_MS || 15000);
const LIFT_API_CACHE_TTL_MS = Number(process.env.LIFT_API_CACHE_TTL_MS || 60000);

let cachedCatalog = null;
let cachedCatalogAt = 0;

function normalizeName(item) {
  return (item.slug || item.name || "").trim().toLowerCase().replace(/-/g, "_");
}

function normalizeIdentity(str = "") {
  return str.trim().toLowerCase().replace(/[-\s]+/g, "_");
}

function mapEquipment(equipment = []) {
  const mapped = new Set();

  for (const item of equipment) {
    const normalized = String(item).trim().toLowerCase();
    if (["dumbbell", "dumbbells"].includes(normalized)) mapped.add("dumbbells");
    if (["bodyweight", "mat"].includes(normalized)) mapped.add("bodyweight");
    if (["band", "bands", "resistance-band"].includes(normalized)) mapped.add("bands");
    if (["barbell", "bench", "cable", "machine", "pull-up-bar"].includes(normalized)) {
      mapped.add("gym");
    }
  }

  return [...mapped];
}

function withImageCacheBust(url) {
  if (!url || !/res\.cloudinary\.com\/[^/]+\/image\/upload\//i.test(url)) {
    return url ?? null;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${Date.now()}`;
}

function mapExercise(item) {
  const name = normalizeName(item);
  const imageUrl = withImageCacheBust(
    item.primaryImageUrl ?? item.media?.images?.find((image) => image.role === "main")?.url ?? item.media?.images?.[0]?.url ?? null,
  );
  const videoUrl = item.media?.videos?.[0]?.url ?? null;
  const thumbnailUrl = withImageCacheBust(
    item.media?.images?.find((image) => image.role === "thumbnail")?.url ?? null,
  );

  return {
    slug: item.slug ?? name,
    name,
    muscle: item.targetMuscles?.[0]?.toLowerCase() ?? item.bodyParts?.[0]?.toLowerCase() ?? null,
    equipment: mapEquipment(item.equipment),
    imageUrl,
    gifUrl: videoUrl ?? thumbnailUrl ?? imageUrl,
  };
}

async function fetchJson(path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LIFT_API_TIMEOUT_MS);

  try {
    const response = await fetch(`${LIFT_API_BASE_URL}${path}`, {
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`lift-api ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function getCatalog() {
  if (cachedCatalog && Date.now() - cachedCatalogAt < LIFT_API_CACHE_TTL_MS) {
    return cachedCatalog;
  }

  const payload = await fetchJson("/api/v1/exercises");
  const items = Array.isArray(payload.data) ? payload.data : [];
  cachedCatalog = (await Promise.all(
    items.map(async (item) => {
      const listItem = mapExercise(item);

      try {
        const detail = await fetchJson(`/api/v1/exercises/${item.slug}`);
        return detail.data ? mapExercise(detail.data) : listItem;
      } catch (error) {
        console.warn("[lift-api] using list exercise media", error.message);
        return listItem;
      }
    }),
  )).filter((item) => item.name && item.muscle);
  cachedCatalogAt = Date.now();

  return cachedCatalog;
}

async function getByName(name) {
  const catalog = await getCatalog();
  const nameKey = normalizeIdentity(name);
  const catalogItem = catalog.find((item) =>
    [item.slug, item.name].filter(Boolean).map(normalizeIdentity).includes(nameKey),
  );
  if (!catalogItem) return null;

  try {
    const payload = await fetchJson(`/api/v1/exercises/${catalogItem.slug}`);
    return payload.data ? mapExercise(payload.data) : catalogItem;
  } catch (error) {
    console.warn("[lift-api] using cached exercise detail", error.message);
    return catalogItem;
  }
}

module.exports = { getCatalog, getByName };

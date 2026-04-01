const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

exports.createNotification = async (userId, { title, body, type = "info", routineId = null, pendingAdjustments = null }) => {
  return await db.notification.create({
    data: { userId, title, body, type, routineId, pendingAdjustments },
  });
};

exports.getUserNotifications = async (userId) => {
  return await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

exports.markAsRead = async (userId, notificationId) => {
  const notif = await db.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!notif) throw new Error("NOT_FOUND");
  return await db.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
};

exports.markAllAsRead = async (userId) => {
  await db.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
};
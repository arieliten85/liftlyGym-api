const notificationService = require("../services/notification.service");

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications =
      await notificationService.getUserNotifications(userId);

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const notif = await notificationService.markAsRead(userId, id);
    res.status(200).json({ success: true, data: notif });
  } catch (error) {
    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Notificación no encontrada" });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await notificationService.markAllAsRead(userId);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

router.get("/",           authMiddleware, notificationController.getNotifications);
router.patch("/:id/read", authMiddleware, notificationController.markAsRead);
router.patch("/read-all", authMiddleware, notificationController.markAllAsRead);

module.exports = router;
const express = require("express");
const cors = require("cors");

const routineRoutes = require("./routes/routine.routes");
const authRoutes = require("./routes/auth.routes");
const notificationRoutes = require("./routes/notification.routes");
const exerciseRoutes = require("./routes/exercise.routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/routines", routineRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/exercises", exerciseRoutes);

module.exports = app;

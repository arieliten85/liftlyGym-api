const app = require("./app");

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, "0.0.0.0", (error) => {
  if (error) return;
  console.log(`Server running on port ${PORT}`);
});

server.on("error", (error) => {
  console.error(`Failed to start server on port ${PORT}:`, error.message);
  process.exitCode = 1;
});

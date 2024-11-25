// server.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import eventRoutes from "./src/routes/event.route.js";
import loguinRoute from "./src/routes/loguin.route.js";
import areaRoute from "./src/routes/area.route.js";

const app = express();

// Middlewares con configuración más específica
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Para ver las peticiones en consola
app.use(morgan("dev"));

// Importante: este middleware debe estar antes de las rutas
app.use(express.json());

// Servir archivos al public
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/public", express.static(path.join(__dirname, "public")));

// Middleware para manejar errores de JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON" });
  }
  next(err);
});

// Routes
app.use("/api/event", eventRoutes);
app.use("/api/loguin", loguinRoute);
app.use("/api/area", areaRoute);

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    message: "Internal server error",
    error: err.message,
  });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

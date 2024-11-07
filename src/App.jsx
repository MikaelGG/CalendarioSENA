// import express from "express";
// import morgan from "morgan";
// import cors from "cors";

// const app = express();

// // Middlewares
// app.use(morgan("dev"));
// app.use(express.json());
// app.use(cors());

// // Middleware para debug
// app.use((req, res, next) => {
//   console.log("Request received:", {
//     method: req.method,
//     path: req.path,
//     body: req.body,
//     headers: req.headers,
//   });
//   next();
// });

// // Routes
// import eventRoutes from "./routes/event.route.js";
// app.use("/api/event", eventRoutes);

// // Error handler
// app.use((err, req, res, next) => {
//   console.error("Error:", err);
//   res.status(500).json({
//     message: "Internal server error",
//     error: err.message,
//   });
// });

// export default app;

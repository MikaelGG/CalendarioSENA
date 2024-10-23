import express from "express";
import morgan from "morgan";

const app = express();

// import routes
import event from "../src/routes/event.route.js";

//middleware
app.use(morgan("dev"));
app.use(express.json());

// routes
app.use("/api/event", event);

import { Router } from "express";
import { querys as areaController } from "../controller/areaSelect.controller.js";

const router = Router();

// GET
router.get("/", areaController.obtenerAreas);

export default router;

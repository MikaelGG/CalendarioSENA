import { Router } from "express";
import { querys as loguinController } from "../controller/loguin.controller.js";

const router = Router();

// POST
router.post("/", loguinController.loguin);

export default router;

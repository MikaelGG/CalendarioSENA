import { Router } from "express";
import multer from "multer";
import { fileURLToPath } from "url";
import path from "path";
import { querys as eventController } from "../controller/event.controller.js";

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Cambiar la ruta para que apunte directamente a la carpeta public en la raíz
    const destinationPath = path.join(__dirname, "../../public"); // Subir un nivel desde src para acceder a la raíz
    console.log("Saving to:", destinationPath); // Imprimir para ver la ruta calculada
    cb(null, destinationPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

// POST
router.post("/", upload.single("img"), eventController.crearEvento);

// GET
router.get("/", eventController.obtenerEvento);

// PUT
router.put("/:id", upload.single("img"), eventController.actualizarEvento);

// DELETE
router.delete("/:id", eventController.eliminarEvento);
export default router;

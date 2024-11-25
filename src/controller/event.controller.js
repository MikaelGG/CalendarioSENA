import { getConnection } from "../models/database.js";
import { parseISO, format } from "date-fns";
import { fileURLToPath } from "url";
import path from "path";
import { promises as fs } from "fs";

const crearEvento = async (req, res) => {
  try {
    console.log("Received event data:", req.body);
    console.log("Received file:", req.file);

    const { id, start, end, extendedProps } = req.body;

    const imgName = req.file ? req.file.filename : null;

    // Verificar el contenido de extendedProps y parsearlo
    let title, area, description, place, vinculo;
    if (extendedProps) {
      const parsedProps = JSON.parse(extendedProps);
      console.log("Parsed extendedProps:", parsedProps);

      title = parsedProps.title;
      area = parsedProps.area;
      description = parsedProps.description;
      place = parsedProps.place;
      vinculo = parsedProps.vinculo;

      console.log(
        "Parsed values - Title:",
        title,
        "Area:",
        area,
        "Description:",
        description,
        "Place:",
        place,
        "Vinculo:",
        vinculo
      );
    } else {
      return res.status(400).json({
        message: "extendedProps is required",
      });
    }

    // Validación básica
    if (!title || !area || !description || !place) {
      return res.status(400).json({
        message: "Title, area and description are required",
      });
    }

    const event = {
      id,
      titulo: title,
      area: area,
      descripcion: description,
      lugar: place,
      url: vinculo,
      fechainicio: start,
      fechafinal: end,
      imagen: imgName,
    };
    const connection = await getConnection();

    await connection.query("INSERT INTO eventos SET ?", event);

    const eventResponse = {
      ...event,
      fechainicio: format(parseISO(start), "yyyy-MM-dd HH:mm:ss"),
      fechafinal: format(parseISO(end), "yyyy-MM-dd HH:mm:ss"),
    };

    // Mejor respuesta
    res.status(201).json({
      message: "Event created successfully",
      event: eventResponse,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({
      message: "Error creating event",
      error: error.message,
    });
  }
};

const obtenerEvento = async (req, res) => {
  try {
    const connection = await getConnection();
    const result = await connection.query("SELECT * FROM eventos");
    res.json(result[0]);
  } catch (error) {
    console.error("Error obtaining events:", error);
    res.status(500).json({
      message: "Error obtaining event",
      error: error.message,
    });
  }
};

const actualizarEvento = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Actualizando evento con id", id);
    console.log("Received body:", req.body);
    console.log("Received file:", req.file);

    const connection = await getConnection();

    const { extendedProps } = req.body;

    const [currentEvent] = await connection.query(
      "SELECT imagen FROM eventos WHERE id = ?",
      [id]
    );

    const [fecha] = await connection.query(
      "SELECT fechainicio, fechafinal FROM eventos WHERE id = ?",
      [id]
    );

    let imgPath;
    if (req.file && currentEvent[0].imagen) {
      try {
        const oldImagePath = path.join(
          __dirname,
          "../../public",
          currentEvent[0].imagen
        );
        await fs.unlink(oldImagePath);
        console.log("Imagen anterior eliminada:", currentEvent[0].imagen);
      } catch (error) {
        if (error.code !== "ENOENT") {
          console.error("Error al eliminar la imagen anterior:", error);
        }
      }
    }

    const imageName = req.file ? req.file.filename : currentEvent[0].imagen;

    let title, area, description, place, vinculo;
    if (extendedProps) {
      let parsedProps;
      try {
        parsedProps =
          typeof extendedProps === "string"
            ? JSON.parse(extendedProps)
            : extendedProps;

        console.log("Parsed extendedProps:", parsedProps);

        title = parsedProps.title;
        area = parsedProps.area;
        description = parsedProps.description;
        place = parsedProps.place;
        vinculo = parsedProps.vinculo;

        console.log(
          "Parsed values - Title:",
          title,
          "Area:",
          area,
          "Description:",
          description,
          "Place:",
          place,
          "Vinculo:",
          vinculo
        );
      } catch (parseError) {
        console.error("Error parsing extendedProps:", parseError);
        return res.status(400).json({
          message: "Invalid extendedProps format",
          error: parseError.message,
        });
      }
    } else {
      return res.status(400).json({
        message: "extendedProps is required",
      });
    }

    const event = {
      area,
      titulo: title,
      descripcion: description,
      lugar: place,
      url: vinculo,
      imagen: imageName,
      fechainicio: fecha[0].fechainicio,
      fechafinal: fecha[0].fechafinal,
    };

    const result = await connection.query("UPDATE eventos SET ? WHERE id = ?", [
      event,
      id,
    ]);
    res.status(200).json({ message: "Event updated", data: result });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({
      message: "Error updating event",
      error: error.message,
    });
  }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const eliminarEvento = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("ID recibido:", id);
    const connection = await getConnection();

    const [event] = await connection.query(
      "SELECT imagen FROM eventos WHERE id = ?",
      [id]
    );

    if (event.length === 0) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }

    const imageName = event[0].imagen;
    console.log("Nombre de imagen encontrado:", imageName);
    if (imageName) {
      try {
        const imagePath = path.join(__dirname, "../../public", imageName);
        await fs.unlink(imagePath);
        console.log("Imagen eliminada correctamente", imageName);
      } catch (error) {
        if (error.code === "ENOENT") {
          console.log("La imagen no existe en el servidor:", imagePath);
        } else {
          console.error("Error al eliminar la imagen:", error);
        }
      }
    }

    await connection.query("DELETE FROM eventos WHERE id = ?", id);
    res.status(200).json({ message: "Event deleted" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({
      message: "Error deleting event",
      error: error.message,
    });
  }
};

export const querys = {
  crearEvento,
  obtenerEvento,
  actualizarEvento,
  eliminarEvento,
};

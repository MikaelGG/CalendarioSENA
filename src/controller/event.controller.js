import { getConnection } from "../models/database.js";
import path from "path";

const crearEvento = async (req, res) => {
  try {
    console.log("Received event data:", req.body);
    console.log("Received file:", req.file);

    const { id, start, end, extendedProps } = req.body;

    let imgPath = null;
    if (req.file) {
      const imgPath = path.join("public", req.file.filename);
    }

    // Verificar el contenido de extendedProps y parsearlo
    let title, area, description, vinculo;
    if (extendedProps) {
      const parsedProps = JSON.parse(extendedProps);
      console.log("Parsed extendedProps:", parsedProps);

      title = parsedProps.title;
      area = parsedProps.area;
      description = parsedProps.description;
      vinculo = parsedProps.vinculo;

      console.log(
        "Parsed values - Title:",
        title,
        "Area:",
        area,
        "Description:",
        description,
        "Vinculo:",
        vinculo
      );
    } else {
      return res.status(400).json({
        message: "extendedProps is required",
      });
    }

    // Validación básica
    if (!title || !area || !description) {
      return res.status(400).json({
        message: "Title, area and description are required",
      });
      console.log("Title, area and description are required");
    }

    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      return date.toISOString().slice(0, 19).replace("T", " ");
    };

    const event = {
      id,
      titulo: title,
      area: area,
      descripcion: description,
      url: vinculo,
      fechainicio: formatDate(start),
      fechafinal: formatDate(end),
      imagen: imgPath,
    };
    const connection = await getConnection();

    await connection.query("INSERT INTO eventos SET ?", event);

    // Mejor respuesta
    res.status(201).json({
      message: "Event created successfully",
      event,
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
    const { extendedProps, start, end, currentImage } = req.body;

    // Formatear las fechas para MySQL
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      return date.toISOString().slice(0, 19).replace("T", " ");
    };

    let imgPath;
    if (req.file) {
      // Si hay un nuevo archivo, usar su ruta
      imgPath = path.join("public", req.file.filename);
    } else if (currentImage) {
      // Si no hay nuevo archivo pero hay imagen existente, mantener la actual
      imgPath = currentImage;
    } else {
      // Si no hay imagen nueva ni existente, establecer como null
      imgPath = null;
    }

    let title, area, description, vinculo;
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
        vinculo = parsedProps.vinculo;

        console.log(
          "Parsed values - Title:",
          title,
          "Area:",
          area,
          "Description:",
          description,
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
      url: vinculo,
      imagen: imgPath,
      fechainicio: formatDate(start),
      fechafinal: formatDate(end),
    };

    const connection = await getConnection();
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

const eliminarEvento = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await getConnection();
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

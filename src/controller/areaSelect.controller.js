import { getConnection } from "../models/database.js";

const obtenerAreas = async (req, res) => {
  try {
    const connection = await getConnection();
    const areas = await connection.query(
      "SELECT * FROM areas ORDER BY idareas ASC"
    );
    res.json(areas[0]);
    console.log(areas);
  } catch (error) {
    console.error("Error obtaining areas:", error);
    res.status(500).json({
      message: "Error obtaining areas",
      error: error.message,
    });
  }
};

export const querys = {
  obtenerAreas,
};

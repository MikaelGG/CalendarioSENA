import { getConnection } from "../models/database.js";
import bcryptjs from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
import { redirect } from "react-router-dom";

dotenv.config();

const loguin = async (req, res) => {
  try {
    console.log("Headers recibidos:", req.headers);
    console.log("Body completo recibido:", req.body);
    console.log("Método de la petición:", req.method);

    const { documento, contra } = req.body;

    console.log("Documento extraído:", documento);
    console.log("Contraseña extraída:", contra);

    if (!documento || !contra) {
      return res
        .status(400)
        .send({ status: "Error", message: "Los campos están incompletos" });
    }

    const connection = await getConnection();

    const [doccon] = await connection.query(
      "SELECT doc_id, contraseña, rol FROM personas WHERE doc_id = ?",
      [documento]
    );

    console.log("Resultado consulta", doccon);

    // Verifica si se encontró algún resultado
    if (!doccon || doccon.length === 0) {
      return res
        .status(400)
        .json({ status: "Error", message: "Usuario no encontrado" });
    }

    if (doccon[0].doc_id !== documento) {
      return res
        .status(400)
        .send({ status: "Error", message: "Error durante el loguin" });
    }
    // Compara la clave encriptada con la que agrega
    //   const loguinCorrecto = await bcryptjs.compare(contra, doccon[0].contraseña);
    // Comprara clave normal con clave no encriprada en bd

    const loguinAccess = contra === doccon[0].contraseña ? true : false;
    console.log(loguinAccess);

    if (loguinAccess === false) {
      return res
        .status(400)
        .send({ status: "Error", message: "Error durante el loguin" });
    }

    const token = jsonwebtoken.sign(
      {
        documento: doccon[0].doc_id,
        rol: doccon[0].rol,
        contra: doccon[0].contraseña,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.json({
      status: "Success",
      message: "Loguin exitoso",
      token,
      user: {
        documento: doccon[0].doc_id,
        rol: doccon[0].rol,
        contra: doccon[0].contraseña,
      },
      redirect: "../src/components/calendar/index.html",
    });

    // const storedToken = localStorage.getItem("token");
    // const storedUser = localStorage.getItem("user");
    // console.log("Token almacenado:", storedToken);
    // console.log("Usuario almacenado:", storedUser);
  } catch (error) {
    res.status(500).json({ message: "Error loguandose", error: error.message });
  }
};

export const querys = {
  loguin,
};

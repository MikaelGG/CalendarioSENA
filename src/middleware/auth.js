import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(403).json({
      status: "Error",
      message: "Token no proporcionado",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      status: "Error",
      message: "Token inválido o expirado",
    });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user.rol !== 1) {
    return res.status(403).json({
      status: "Error",
      message: "Acceso denegado - Se requieren permisos de administrador",
    });
  }
  next();
};

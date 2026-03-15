import { Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt";
import { AuthRequest } from "../types";

const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = verifyToken(token);
    req.user = {
      userId: decodedToken.userId,
      tenantId: decodedToken.tenantId,
      permissions: decodedToken.permissions,
    };

    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export default authMiddleware;

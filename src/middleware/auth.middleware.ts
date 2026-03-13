import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt";


interface AuthRequest extends Request {
  user?: {
    userId: number;
    tenantId: number;
    permissions: string[];
  };
}


const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
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

import { Request, Response, NextFunction } from "express";

interface AuthRequest extends Request {
  user?: {
    userId: number;
    tenantId: number;
    permissions: string[];
  };
}

export const requirePermission = (permission: string) => {
  return (req:AuthRequest, res:Response, next:NextFunction) => {
    if (!req.user?.permissions.includes(permission)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};

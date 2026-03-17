import express from "express";
import { requirePermission } from "@/middleware/permission.middleware";
import authMiddleware from "@/middleware/auth.middleware";
import { getAllUsers } from "./user.controller";
const route = express.Router()

route.use(authMiddleware);
route.get("/", requirePermission("user.read"),getAllUsers);
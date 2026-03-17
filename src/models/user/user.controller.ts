import { Response } from "express";
import { AuthRequest } from "../../types/auth";
import userService from "./user.service";

export const getAllUsers = async (req: AuthRequest, res: Response) => {
    try {
        // Get pagination params from query
        const { page = 1, limit = 10 } = req.query;

        // Get users from service
        const result = await userService.getAllUsers(
            req.user?.tenantId as number,
            Number(page),
            Number(limit),
        );

        return res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            ...result,
        });
    } catch (error: any) {
        console.error("Get all users error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch users",
            error: error?.message,
        });
    }
};

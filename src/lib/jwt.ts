import jwt from "jsonwebtoken";
import { TokenPayload } from "../types";

const JWT_SECRET = process.env.JWT_SECRET!;

export const generateToken = (payload: TokenPayload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
};

export const verifyToken = (token: string): TokenPayload => {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

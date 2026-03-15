import { Request } from "express";
import { TokenPayload } from "./jwt";

export interface AuthUser extends TokenPayload {}

export interface AuthRequest extends Request {
    user?: AuthUser;
}

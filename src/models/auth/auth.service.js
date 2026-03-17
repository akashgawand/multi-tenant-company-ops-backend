import prisma from '../../lib/client.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { hashPassword, comparePassword } from '../../lib/hash.ts';
import { generateToken } from '../../lib/jwt.ts';


const register = async ({
    name,
    email,
    password,
    role,
    tenantId,
}) => {

    const normalizedEmail = email.toLowerCase().trim();

    return await prisma.$transaction(async (tx) => {

        // 1️ Check if email exists inside tenant
        const existingUser = await tx.user.findFirst({
            where: {
                email: normalizedEmail,
                tenantId
            }
        });

        if (existingUser) {
            throw new Error("User already exists in this tenant");
        }

        //  Validate role exists in same tenant
        const roleRecord = await tx.role.findFirst({
            where: {
                tenantId,
                name: role
            }
        });

        if (!roleRecord) {
            throw new Error("Invalid role for this tenant");
        }

        //  Hash password
        const hashedPassword = await hashPassword(password);

        //Create user
        const user = await tx.user.create({
            data: {
                name,
                email: normalizedEmail,
                password: hashedPassword,
                tenantId
            }
        });

        //  Assign role
        await tx.userRole.create({
            data: {
                userId: user.id,
                roleId: roleRecord.id
            }
        });

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: roleRecord.name
        };

    });
};


const login = async ({ email, password }) => {
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            UserRoles: {
                include: {
                    role: {
                        include: {
                            rolePermissions: {
                                include: {
                                    permission: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!user) throw new Error("Invalid credentials");

    const isValid = await comparePassword(password, user.password);
    if (!isValid) throw new Error("Invalid credentials");

    if (user.status !== "ACTIVE") {
        throw new Error("User is inactive");
    }

    // Flatten permissions
    const permissions = [
        ...new Set(
            user.UserRoles.flatMap((ur) =>
                ur.role.rolePermissions.map((rp) => rp.permission.name)
            )
        )
    ];

    const token = generateToken({
        userId: user.id,
        tenantId: user.tenantId,
        permissions,
    });

    return { token };
}



export default {
    register,
    login
}
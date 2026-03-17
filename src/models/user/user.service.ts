import prisma from "../../lib/client.js";
import { getPaginationParams, getPaginationMeta } from "../../utils/pagination";
import { userSelect, QueriedUser, QueriedUserRole } from "../../types/user";

/**
 * Get all users for a tenant with pagination
 * @param {number} tenantId - Tenant ID
 * @param {string|number} page - Current page (1-indexed)
 * @param {string|number} limit - Items per page
 * @returns {Promise} - Paginated users response
 */
export const getAllUsers = async (
    tenantId: number,
    page?: string | number,
    limit?: string | number,
) => {
    try {
        // Get pagination params
        const { skip, take } = getPaginationParams(page, limit);

        // Get total count of active users in tenant
        const total = await prisma.user.count({
            where: {
                tenantId,
                status: { not: "DELETED" }, // Exclude deleted users
            },
        });

        // Get paginated users with roles
        const users = await prisma.user.findMany({
            where: {
                tenantId,
                status: { not: "DELETED" },
            },
            select: userSelect,
            skip,
            take,
            orderBy: {
                createdAt: "desc", // Latest users first
            },
        });

        // Transform response - flatten roles
        const transformedUsers = users.map((user: QueriedUser) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            status: user.status,
            roles: user.UserRoles.map((ur: QueriedUserRole) => ({
                id: ur.role.id,
                name: ur.role.name,
            })),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }));

        // Get pagination metadata
        const pagination = getPaginationMeta(total, page, limit);

        return {
            data: transformedUsers,
            pagination,
        };
    } catch (error) {
        throw error;
    }
};

export default {
    getAllUsers,
};

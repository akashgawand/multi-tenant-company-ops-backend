import {
    PaginationParams,
    PaginationMeta,
    PaginatedResponse,
} from "@/types/pagination";

/**
 * Calculate pagination parameters
 * @param {number} page - Current page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Object} - { skip, take }
 */
export const getPaginationParams = (
    page?: string | number,
    limit?: string | number,
): PaginationParams => {
    const pageNum = Number(page);
    const limitNum = Number(limit);
    

    const validPage = pageNum > 0 ? pageNum : 1;
    const validLimit = limitNum > 0 && limitNum <= 100 ? limitNum : 10;

    return {
    skip: (validPage - 1) * validLimit,
    take: validLimit,
    page: 0,
    limit: 0,
};
};

/**
 * Generate pagination metadata
 * @param {number} total - Total number of items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @returns {Object} - Pagination metadata
 */
export const getPaginationMeta = (
    total: number,
    page?: string | number,
    limit?: string | number,
): PaginationMeta => {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

    const totalPages = Math.ceil(total / limitNum);

    return {
    total,
    page: pageNum,
    limit: limitNum,
    skip,
    take,
    totalPages,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
    };
};

/**
 * Create paginated response
 * @param {Array} data - Data items
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} - Paginated response
 */
export const createPaginatedResponse = <T>(
    data: T[],
    total: number,
    page?: string | number,
    limit?: string | number,
): PaginatedResponse<T> => {
    return {
        data,
        pagination: getPaginationMeta(total, page, limit),
    };
};

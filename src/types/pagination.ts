export interface PaginationParams {
    page: number;
    limit: number;
    skip: number;
    take: number;
}

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    skip: number;
    take: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: PaginationMeta;
}
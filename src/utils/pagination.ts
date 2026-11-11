export interface PaginationQuery {
    page?: number | string;
    limit?: number | string;
}

export interface PaginationParams {
    page: number;
    limit: number;
    skip: number;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export const getPaginationParams = (
    query: PaginationQuery,
    defaultLimit = 12,
    maxLimit = 100,
): PaginationParams => {
    const parsedPage = Number(query.page);
    const parsedLimit = Number(query.limit);

    const page =
        Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const rawLimit =
        Number.isInteger(parsedLimit) && parsedLimit > 0
            ? parsedLimit
            : defaultLimit;
    const limit = Math.min(rawLimit, maxLimit);
    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

export const formatPaginatedResponse = <T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
): PaginatedResponse<T> => {
    return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
    };
};

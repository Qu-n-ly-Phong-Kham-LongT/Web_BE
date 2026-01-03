export const createPagination = (
    currentPage: number,
    pageSize: number,
    totalItems: number
) => {
    const totalPages = Math.ceil(totalItems / pageSize);

    return {
        currentPage,
        pageSize,
        totalItems,
        totalPages,
    };
};
export const createPagination = (
    currentPage: number,
    size: number,
    totalItems: number
) => {
    const totalPages = Math.ceil(totalItems / size);

    return {
        currentPage,
        size,
        totalItems,
        totalPages,
    };
};
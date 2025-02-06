// utils/pagination.js
import { ChevronLeft, ChevronRight } from "lucide-react";

export const paginateData = (data, currentPage, itemsPerPage) => {
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(data.length / itemsPerPage);

  return {
    currentItems,
    totalPages,
  };
};

export const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = window.innerWidth < 640 ? 3 : 5; // Responsive page numbers

    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    // Add first page and ellipsis if necessary
    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) pageNumbers.push("...");
    }

    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    // Add last page and ellipsis if necessary
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pageNumbers.push("...");
      pageNumbers.push(totalPages);
    }

    return pageNumbers.map((page, index) => {
      if (page === "...") {
        return (
          <span
            key={`ellipsis-${index}`}
            className="hidden md:inline-block px-2 py-1 text-gray-500"
          >
            ...
          </span>
        );
      }
      return (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 md:px-4 py-1 md:py-2 rounded-md text-sm md:text-base transition-all duration-200 min-w-[32px] md:min-w-[40px]
            ${
              page === currentPage
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-blue-50 border border-gray-200"
            }`}
        >
          {page}
        </button>
      );
    });
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1 md:gap-2 mt-4 md:mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`inline-flex items-center gap-1 px-2 md:px-4 py-1 md:py-2 rounded-md text-sm md:text-base transition-all duration-200
          ${
            currentPage === 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white text-blue-600 hover:bg-blue-50 border border-gray-200"
          }`}
      >
        <ChevronLeft className="w-4 h-4 hidden md:inline" />
        Prev
      </button>

      <div className="flex items-center gap-1 md:gap-2">
        {renderPageNumbers()}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`inline-flex items-center gap-1 px-2 md:px-4 py-1 md:py-2 rounded-md text-sm md:text-base transition-all duration-200
          ${
            currentPage === totalPages
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white text-blue-600 hover:bg-blue-50 border border-gray-200"
          }`}
      >
        Next
        <ChevronRight className="w-4 h-4 hidden md:inline" />
      </button>
    </div>
  );
};

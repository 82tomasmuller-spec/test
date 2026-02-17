import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

export default function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  const getHref = (page: number) => {
    const separator = basePath.includes('?') ? '&' : '?';
    return `${basePath}${separator}page=${page}`;
  };

  return (
    <nav aria-label="Stránkování" className="flex justify-center mt-8">
      <ul className="flex items-center gap-1">
        {/* Previous */}
        <li>
          {currentPage > 1 ? (
            <Link
              href={getHref(currentPage - 1)}
              className="px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              &laquo; Předchozí
            </Link>
          ) : (
            <span className="px-3 py-2 text-gray-300 cursor-not-allowed">&laquo; Předchozí</span>
          )}
        </li>

        {/* Page numbers */}
        {pages.map((page, i) => (
          <li key={i}>
            {page === '...' ? (
              <span className="px-3 py-2 text-gray-400">...</span>
            ) : page === currentPage ? (
              <span className="px-3 py-2 bg-primary-600 text-white rounded-lg font-medium">
                {page}
              </span>
            ) : (
              <Link
                href={getHref(page as number)}
                className="px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                {page}
              </Link>
            )}
          </li>
        ))}

        {/* Next */}
        <li>
          {currentPage < totalPages ? (
            <Link
              href={getHref(currentPage + 1)}
              className="px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Další &raquo;
            </Link>
          ) : (
            <span className="px-3 py-2 text-gray-300 cursor-not-allowed">Další &raquo;</span>
          )}
        </li>
      </ul>
    </nav>
  );
}

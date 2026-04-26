import { useState } from "react";

interface UsePaginationOptions {
  defaultLimit?: number;
}

export function usePagination({ defaultLimit = 20 }: UsePaginationOptions = {}) {
  const [page, setPage] = useState(1);
  const [limit] = useState(defaultLimit);

  const reset = () => setPage(1);

  return { page, limit, setPage, reset };
}

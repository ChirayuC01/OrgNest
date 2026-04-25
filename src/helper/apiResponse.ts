export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function success<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data }, { status });
}

export function paginated<T>(data: T[], meta: PaginationMeta): Response {
  return Response.json({ success: true, data, meta });
}

export function error(message: string, status = 400, code?: string): Response {
  return Response.json({ success: false, error: message, ...(code && { code }) }, { status });
}

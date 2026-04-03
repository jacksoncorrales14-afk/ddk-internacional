import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useApiGet<T>(url: string | null) {
  return useSWR<T>(url, fetcher);
}

// Fetcher para respuestas paginadas
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

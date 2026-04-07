export function TableSkeleton({ columns = 5, rows = 5 }: { columns?: number; rows?: number }) {
  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-6 py-3">
                  <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {Array.from({ length: rows }).map((_, row) => (
              <tr key={row}>
                {Array.from({ length: columns }).map((_, col) => (
                  <td key={col} className="px-6 py-4">
                    <div
                      className="h-4 animate-pulse rounded bg-gray-200"
                      style={{ width: `${60 + ((col * 17 + row * 13) % 40)}%` }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card text-center">
          <div className="mx-auto mb-2 h-9 w-16 animate-pulse rounded bg-gray-200" />
          <div className="mx-auto h-4 w-24 animate-pulse rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

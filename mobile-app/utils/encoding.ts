/**
 * Codifica parâmetros de navegação para URLs
 */
export const encodeNavParams = (params: Record<string, string | number | null | undefined>): Record<string, string> => {
  return Object.fromEntries(
    Object.entries(params)
      .filter(([, v]) => v != null)
      .map(([k, v]) => [k, encodeURIComponent(String(v))])
  );
};

/**
 * Cria query string com parâmetros codificados
 */
export const buildQueryString = (params: Record<string, string | number | null | undefined>): string => {
  const encoded = encodeNavParams(params);
  return new URLSearchParams(encoded).toString();
};

/**
 * Junta base URL com query string
 */
export const buildRouteWithParams = (
  basePath: string,
  params: Record<string, string | number | null | undefined>
): string => {
  const query = buildQueryString(params);
  return query ? `${basePath}?${query}` : basePath;
};

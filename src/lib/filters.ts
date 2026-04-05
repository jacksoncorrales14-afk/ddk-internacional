/**
 * Parsea filtros estandar (desde, hasta, trabajadorId, ubicacion) desde un URL.
 * - hasta incluye todo el dia (T23:59:59).
 */
export function parseFiltros(url: string) {
  const { searchParams } = new URL(url);
  const desdeStr = searchParams.get("desde");
  const hastaStr = searchParams.get("hasta");

  return {
    desde: desdeStr ? new Date(desdeStr + "T00:00:00") : undefined,
    hasta: hastaStr ? new Date(hastaStr + "T23:59:59") : undefined,
    trabajadorId: searchParams.get("trabajadorId") || undefined,
    ubicacion: searchParams.get("ubicacion") || undefined,
  };
}

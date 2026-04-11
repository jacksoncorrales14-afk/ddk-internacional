-- ─────────────────────────────────────────────────────────────
-- Limpieza de atestados con URL vacia o invalida
-- ─────────────────────────────────────────────────────────────
-- Contexto: Antes del fix de sanitizacion de nombres de archivo,
-- los uploads a Supabase Storage fallaban silenciosamente cuando
-- el nombre contenia tildes, espacios o caracteres especiales.
-- El fallback guardaba el atestado con url = "" lo que rompia
-- el link "Ver" en el admin.
--
-- Este script ayuda a identificar y (opcionalmente) limpiar esos
-- registros huerfanos.
--
-- IMPORTANTE: Ejecutar primero los SELECT para revisar antes de
-- hacer DELETE. Hacer backup de la tabla si tienes dudas.
-- ─────────────────────────────────────────────────────────────

-- 1) Ver cuantos atestados estan rotos
SELECT COUNT(*) AS total_rotos
FROM "Atestado"
WHERE url = '' OR url NOT LIKE 'http%';

-- 2) Ver el detalle: que candidatos tienen documentos rotos
SELECT
  c.id AS candidato_id,
  c.nombre,
  c.cedula,
  c.email,
  c.telefono,
  COUNT(a.id) AS docs_rotos,
  STRING_AGG(a.nombre, ', ') AS archivos
FROM "Atestado" a
JOIN "Candidato" c ON c.id = a."candidatoId"
WHERE a.url = '' OR a.url NOT LIKE 'http%'
GROUP BY c.id, c.nombre, c.cedula, c.email, c.telefono
ORDER BY docs_rotos DESC;

-- 3) (OPCIONAL) Eliminar los atestados rotos de la base de datos.
--    Descomentar la siguiente linea SOLO cuando hayas contactado
--    a los candidatos afectados y quieras limpiar la tabla.
--
-- DELETE FROM "Atestado"
-- WHERE url = '' OR url NOT LIKE 'http%';

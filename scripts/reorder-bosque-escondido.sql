-- Reordenar rondas de Bosque Escondido
-- Orden deseado: Rotonda Lote 9 (1), Rotonda Lote 4 (2), Rotonda Lote 37 y 40 (3), Área Social (4), Rotonda Lote 13 (5)
-- Actualmente Rotonda Lote 13 está en orden 4 y Área Social en orden 5, hay que intercambiarlos.
-- Se usa orden temporal 99 para evitar conflicto con unique constraint (ubicacion, orden).

BEGIN;

-- Paso 1: Mover Rotonda Lote 13 a orden temporal
UPDATE "PuntoRuta"
SET orden = 99
WHERE nombre = 'Rotonda Lote 13' AND ubicacion = 'Bosque Escondido';

-- Paso 2: Mover Área Social a orden 4
UPDATE "PuntoRuta"
SET orden = 4
WHERE nombre = 'Área Social' AND ubicacion = 'Bosque Escondido';

-- Paso 3: Mover Rotonda Lote 13 a orden 5
UPDATE "PuntoRuta"
SET orden = 5
WHERE nombre = 'Rotonda Lote 13' AND ubicacion = 'Bosque Escondido';

COMMIT;

-- Verificar el resultado
SELECT nombre, orden FROM "PuntoRuta" WHERE ubicacion = 'Bosque Escondido' ORDER BY orden;

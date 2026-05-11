-- Remove servicos duplicados pelo mesmo nome mantendo o registro mais antigo.
-- Execute somente depois de backup do banco.

DELETE s
FROM Service s
JOIN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY LOWER(TRIM(name))
        ORDER BY createdAt ASC, id ASC
      ) AS row_number
    FROM Service
  ) ranked
  WHERE ranked.row_number > 1
) duplicates ON duplicates.id = s.id;

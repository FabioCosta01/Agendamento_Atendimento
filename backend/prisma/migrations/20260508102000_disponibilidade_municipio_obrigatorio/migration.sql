UPDATE `disponibilidade_agenda` d
INNER JOIN (
  SELECT `extensionista_id`, MIN(`municipio_id`) AS `municipio_id`
  FROM `extensionista_municipio`
  GROUP BY `extensionista_id`
) em ON em.`extensionista_id` = d.`extensionista_id`
SET d.`municipio_id` = em.`municipio_id`
WHERE d.`municipio_id` IS NULL;

DELETE FROM `disponibilidade_agenda`
WHERE `municipio_id` IS NULL
  AND `id` NOT IN (
    SELECT `disponibilidade_id`
    FROM `agendamento`
    WHERE `disponibilidade_id` IS NOT NULL
  );

ALTER TABLE `disponibilidade_agenda`
  DROP FOREIGN KEY `disponibilidade_agenda_municipio_id_fkey`;

ALTER TABLE `disponibilidade_agenda`
  MODIFY `municipio_id` VARCHAR(191) NOT NULL;

ALTER TABLE `disponibilidade_agenda`
  ADD CONSTRAINT `disponibilidade_agenda_municipio_id_fkey`
  FOREIGN KEY (`municipio_id`) REFERENCES `municipio_atendimento`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

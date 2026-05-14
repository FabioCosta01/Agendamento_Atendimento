ALTER TABLE `agendamento`
  DROP FOREIGN KEY `agendamento_disponibilidade_id_fkey`;

ALTER TABLE `disponibilidade_agenda`
  DROP FOREIGN KEY `disponibilidade_agenda_municipio_id_fkey`;

ALTER TABLE `extensionista_municipio`
  DROP FOREIGN KEY `extensionista_municipio_municipio_id_fkey`;

UPDATE `agendamento`
SET `disponibilidade_id` = NULL
WHERE `disponibilidade_id` IS NOT NULL;

DELETE FROM `disponibilidade_agenda`;
DELETE FROM `extensionista_municipio`;
DELETE FROM `municipio_atendimento`;

ALTER TABLE `agendamento`
  ADD CONSTRAINT `agendamento_disponibilidade_id_fkey`
  FOREIGN KEY (`disponibilidade_id`) REFERENCES `disponibilidade_agenda`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

DROP TABLE `municipio_atendimento`;

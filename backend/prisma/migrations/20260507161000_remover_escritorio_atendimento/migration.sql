ALTER TABLE `usuario` ADD COLUMN `municipio_atendimento_id` VARCHAR(191) NULL;

UPDATE `usuario` u
INNER JOIN `escritorio_atendimento` e ON e.`id` = u.`escritorio_atendimento_id`
SET u.`municipio_atendimento_id` = e.`municipio_id`
WHERE u.`escritorio_atendimento_id` IS NOT NULL;

CREATE INDEX `usuario_municipio_atendimento_id_idx` ON `usuario`(`municipio_atendimento_id`);

ALTER TABLE `usuario`
  ADD CONSTRAINT `usuario_municipio_atendimento_id_fkey`
  FOREIGN KEY (`municipio_atendimento_id`) REFERENCES `municipio_atendimento`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `usuario` DROP FOREIGN KEY `usuario_escritorio_atendimento_id_fkey`;
DROP INDEX `usuario_escritorio_atendimento_id_idx` ON `usuario`;
ALTER TABLE `usuario` DROP COLUMN `escritorio_atendimento_id`;

ALTER TABLE `escritorio_atendimento` DROP FOREIGN KEY `escritorio_atendimento_municipio_id_fkey`;
DROP TABLE `escritorio_atendimento`;

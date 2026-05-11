CREATE TABLE `extensionista_municipio` (
  `id` VARCHAR(191) NOT NULL,
  `extensionista_id` VARCHAR(191) NOT NULL,
  `municipio_id` VARCHAR(191) NOT NULL,
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `extensionista_municipio_unique`(`extensionista_id`, `municipio_id`),
  INDEX `extensionista_municipio_municipio_id_idx`(`municipio_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `extensionista_municipio` (`id`, `extensionista_id`, `municipio_id`, `criado_em`)
SELECT CONCAT('mig-', u.`id`, '-', u.`municipio_atendimento_id`), u.`id`, u.`municipio_atendimento_id`, CURRENT_TIMESTAMP(3)
FROM `usuario` u
WHERE u.`municipio_atendimento_id` IS NOT NULL
  AND u.`perfil` = 'EXTENSIONISTA';

ALTER TABLE `disponibilidade_agenda` ADD COLUMN `municipio_id` VARCHAR(191) NULL;
UPDATE `disponibilidade_agenda` d
INNER JOIN `usuario` u ON u.`id` = d.`extensionista_id`
SET d.`municipio_id` = u.`municipio_atendimento_id`
WHERE u.`municipio_atendimento_id` IS NOT NULL;
CREATE INDEX `disponibilidade_municipio_inicio_idx` ON `disponibilidade_agenda`(`municipio_id`, `inicio`);

ALTER TABLE `extensionista_municipio`
  ADD CONSTRAINT `extensionista_municipio_extensionista_id_fkey`
  FOREIGN KEY (`extensionista_id`) REFERENCES `usuario`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `extensionista_municipio`
  ADD CONSTRAINT `extensionista_municipio_municipio_id_fkey`
  FOREIGN KEY (`municipio_id`) REFERENCES `municipio_atendimento`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `disponibilidade_agenda`
  ADD CONSTRAINT `disponibilidade_agenda_municipio_id_fkey`
  FOREIGN KEY (`municipio_id`) REFERENCES `municipio_atendimento`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `usuario` DROP FOREIGN KEY `usuario_municipio_atendimento_id_fkey`;
DROP INDEX `usuario_municipio_atendimento_id_idx` ON `usuario`;
ALTER TABLE `usuario` DROP COLUMN `municipio_atendimento_id`;

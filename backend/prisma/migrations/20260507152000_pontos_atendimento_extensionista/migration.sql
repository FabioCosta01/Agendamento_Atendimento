CREATE TABLE `municipio_atendimento` (
  `id` VARCHAR(191) NOT NULL,
  `nome` VARCHAR(191) NOT NULL,
  `uf` VARCHAR(191) NOT NULL DEFAULT 'MT',
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` DATETIME(3) NOT NULL,

  UNIQUE INDEX `municipio_atendimento_nome_uf_key`(`nome`, `uf`),
  INDEX `municipio_atendimento_ativo_idx`(`ativo`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `escritorio_atendimento` (
  `id` VARCHAR(191) NOT NULL,
  `municipio_id` VARCHAR(191) NOT NULL,
  `nome` VARCHAR(191) NOT NULL,
  `endereco` VARCHAR(191) NULL,
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` DATETIME(3) NOT NULL,

  UNIQUE INDEX `escritorio_atendimento_municipio_nome_key`(`municipio_id`, `nome`),
  INDEX `escritorio_atendimento_municipio_ativo_idx`(`municipio_id`, `ativo`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `usuario` ADD COLUMN `escritorio_atendimento_id` VARCHAR(191) NULL;
CREATE INDEX `usuario_escritorio_atendimento_id_idx` ON `usuario`(`escritorio_atendimento_id`);

ALTER TABLE `escritorio_atendimento`
  ADD CONSTRAINT `escritorio_atendimento_municipio_id_fkey`
  FOREIGN KEY (`municipio_id`) REFERENCES `municipio_atendimento`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `usuario`
  ADD CONSTRAINT `usuario_escritorio_atendimento_id_fkey`
  FOREIGN KEY (`escritorio_atendimento_id`) REFERENCES `escritorio_atendimento`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

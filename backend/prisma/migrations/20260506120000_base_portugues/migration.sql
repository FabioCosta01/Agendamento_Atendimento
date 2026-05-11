-- CreateTable
CREATE TABLE `usuario` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `documento` VARCHAR(191) NOT NULL,
    `senha_hash` VARCHAR(191) NOT NULL,
    `telefone` VARCHAR(191) NULL,
    `perfil` ENUM('SOLICITANTE', 'EXTENSIONISTA', 'ADMINISTRADOR') NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `usuario_email_key`(`email`),
    UNIQUE INDEX `usuario_documento_key`(`documento`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `servico` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NULL,
    `duracao_minutos` INTEGER NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `servico_ativo_idx`(`ativo`),
    INDEX `servico_nome_idx`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `propriedade` (
    `id` VARCHAR(191) NOT NULL,
    `proprietario_id` VARCHAR(191) NOT NULL,
    `nome_proprietario` VARCHAR(191) NOT NULL,
    `documento_proprietario` VARCHAR(191) NOT NULL,
    `registro_rural` VARCHAR(191) NULL,
    `codigo_funrural` VARCHAR(191) NULL,
    `nome_exibicao` VARCHAR(191) NOT NULL,
    `municipio` VARCHAR(191) NOT NULL,
    `uf` VARCHAR(191) NOT NULL,
    `endereco` VARCHAR(191) NULL,
    `possui_habite_se` BOOLEAN NOT NULL DEFAULT false,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `propriedade_proprietario_id_idx`(`proprietario_id`),
    INDEX `propriedade_municipio_uf_idx`(`municipio`, `uf`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `disponibilidade_agenda` (
    `id` VARCHAR(191) NOT NULL,
    `extensionista_id` VARCHAR(191) NOT NULL,
    `inicio` DATETIME(3) NOT NULL,
    `fim` DATETIME(3) NOT NULL,
    `capacidade` INTEGER NOT NULL DEFAULT 1,
    `observacoes` VARCHAR(191) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `disponibilidade_extensionista_inicio_key`(`extensionista_id`, `inicio`),
    INDEX `disponibilidade_extensionista_inicio_idx`(`extensionista_id`, `inicio`),
    INDEX `disponibilidade_inicio_idx`(`inicio`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agendamento` (
    `id` VARCHAR(191) NOT NULL,
    `solicitante_id` VARCHAR(191) NOT NULL,
    `extensionista_id` VARCHAR(191) NULL,
    `servico_id` VARCHAR(191) NOT NULL,
    `propriedade_id` VARCHAR(191) NOT NULL,
    `disponibilidade_id` VARCHAR(191) NULL,
    `codigo_protocolo` VARCHAR(191) NOT NULL,
    `data_preferida` DATETIME(3) NOT NULL,
    `inicio_agendado` DATETIME(3) NULL,
    `fim_agendado` DATETIME(3) NULL,
    `status` ENUM('SOLICITADO', 'APROVADO', 'REAGENDADO', 'CANCELADO', 'CONCLUIDO') NOT NULL DEFAULT 'SOLICITADO',
    `observacoes` VARCHAR(191) NULL,
    `justificativa` VARCHAR(191) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `agendamento_codigo_protocolo_key`(`codigo_protocolo`),
    INDEX `agendamento_solicitante_criado_em_idx`(`solicitante_id`, `criado_em`),
    INDEX `agendamento_extensionista_inicio_idx`(`extensionista_id`, `inicio_agendado`),
    INDEX `agendamento_disponibilidade_id_idx`(`disponibilidade_id`),
    INDEX `agendamento_status_criado_em_idx`(`status`, `criado_em`),
    INDEX `agendamento_servico_id_idx`(`servico_id`),
    INDEX `agendamento_propriedade_id_idx`(`propriedade_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `anexo` (
    `id` VARCHAR(191) NOT NULL,
    `agendamento_id` VARCHAR(191) NOT NULL,
    `nome_arquivo` VARCHAR(191) NOT NULL,
    `caminho_arquivo` VARCHAR(191) NOT NULL,
    `tipo_mime` VARCHAR(191) NOT NULL,
    `tamanho_bytes` INTEGER NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `anexo_agendamento_id_idx`(`agendamento_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auditoria` (
    `id` VARCHAR(191) NOT NULL,
    `usuario_id` VARCHAR(191) NOT NULL,
    `entidade` VARCHAR(191) NOT NULL,
    `entidade_id` VARCHAR(191) NOT NULL,
    `acao` ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'STATUS_CHANGE') NOT NULL,
    `dados` JSON NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `auditoria_usuario_criado_em_idx`(`usuario_id`, `criado_em`),
    INDEX `auditoria_entidade_entidade_id_idx`(`entidade`, `entidade_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notificacao` (
    `id` VARCHAR(191) NOT NULL,
    `usuario_id` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `mensagem` TEXT NOT NULL,
    `lido_em` DATETIME(3) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notificacao_usuario_criado_em_idx`(`usuario_id`, `criado_em`),
    INDEX `notificacao_lido_em_idx`(`lido_em`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `propriedade` ADD CONSTRAINT `propriedade_proprietario_id_fkey` FOREIGN KEY (`proprietario_id`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `disponibilidade_agenda` ADD CONSTRAINT `disponibilidade_agenda_extensionista_id_fkey` FOREIGN KEY (`extensionista_id`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agendamento` ADD CONSTRAINT `agendamento_solicitante_id_fkey` FOREIGN KEY (`solicitante_id`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agendamento` ADD CONSTRAINT `agendamento_extensionista_id_fkey` FOREIGN KEY (`extensionista_id`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agendamento` ADD CONSTRAINT `agendamento_servico_id_fkey` FOREIGN KEY (`servico_id`) REFERENCES `servico`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agendamento` ADD CONSTRAINT `agendamento_propriedade_id_fkey` FOREIGN KEY (`propriedade_id`) REFERENCES `propriedade`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agendamento` ADD CONSTRAINT `agendamento_disponibilidade_id_fkey` FOREIGN KEY (`disponibilidade_id`) REFERENCES `disponibilidade_agenda`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `anexo` ADD CONSTRAINT `anexo_agendamento_id_fkey` FOREIGN KEY (`agendamento_id`) REFERENCES `agendamento`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auditoria` ADD CONSTRAINT `auditoria_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificacao` ADD CONSTRAINT `notificacao_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

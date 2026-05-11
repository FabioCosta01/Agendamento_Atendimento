ALTER TABLE `servico`
  ADD COLUMN `classificacao` VARCHAR(191) NOT NULL DEFAULT 'Outros atendimentos';

CREATE INDEX `servico_classificacao_idx` ON `servico`(`classificacao`);

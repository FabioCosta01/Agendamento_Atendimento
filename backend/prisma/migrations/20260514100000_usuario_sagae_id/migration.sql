ALTER TABLE `usuario`
  ADD COLUMN `sagae_id` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `usuario_sagae_id_key` ON `usuario`(`sagae_id`);

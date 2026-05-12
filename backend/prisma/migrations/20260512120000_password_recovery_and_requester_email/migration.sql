-- AlterTable
ALTER TABLE `usuario` ADD COLUMN `deve_trocar_senha` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable (auditoria: novo tipo de acao)
ALTER TABLE `auditoria` MODIFY `acao` ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'STATUS_CHANGE', 'PASSWORD_RESET') NOT NULL;

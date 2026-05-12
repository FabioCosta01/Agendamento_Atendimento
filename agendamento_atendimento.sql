-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 11/05/2026 às 23:12
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `agendamento_atendimento`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `agendamento`
--

CREATE TABLE `agendamento` (
  `id` varchar(191) NOT NULL,
  `solicitante_id` varchar(191) NOT NULL,
  `extensionista_id` varchar(191) DEFAULT NULL,
  `servico_id` varchar(191) NOT NULL,
  `propriedade_id` varchar(191) NOT NULL,
  `disponibilidade_id` varchar(191) DEFAULT NULL,
  `codigo_protocolo` varchar(191) NOT NULL,
  `data_preferida` datetime(3) NOT NULL,
  `inicio_agendado` datetime(3) DEFAULT NULL,
  `fim_agendado` datetime(3) DEFAULT NULL,
  `status` enum('SOLICITADO','APROVADO','REAGENDADO','CANCELADO','CONCLUIDO') NOT NULL DEFAULT 'SOLICITADO',
  `observacoes` varchar(191) DEFAULT NULL,
  `justificativa` varchar(191) DEFAULT NULL,
  `criado_em` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `atualizado_em` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `agendamento`
--

INSERT INTO `agendamento` (`id`, `solicitante_id`, `extensionista_id`, `servico_id`, `propriedade_id`, `disponibilidade_id`, `codigo_protocolo`, `data_preferida`, `inicio_agendado`, `fim_agendado`, `status`, `observacoes`, `justificativa`, `criado_em`, `atualizado_em`) VALUES
('cmox4nzew000gv5ecjfet4gxb', 'cmou7ikmd0002v5asqpwf6f36', 'cmou7ikm60001v5asr3ywnj2u', 'seed-servico-siapp', 'seed-propriedade-solicitante-padrao', 'cmox4i72f000av5ec95vfy58r', 'AGE-2026-00001', '2026-05-11 15:00:00.000', '2026-05-11 11:00:00.000', '2026-05-11 12:00:00.000', 'APROVADO', '', NULL, '2026-05-08 16:26:47.433', '2026-05-08 16:27:16.217'),
('cmox4pcjn000mv5ecerly1b4a', 'cmou7ikmd0002v5asqpwf6f36', 'cmou7ikm60001v5asr3ywnj2u', 'seed-servico-gestao-agricola', 'seed-propriedade-solicitante-padrao', 'cmox4i72f000cv5ec3r9rj1cl', 'AGE-2026-00002', '2026-05-11 23:00:00.000', '2026-05-11 19:00:00.000', '2026-05-11 20:00:00.000', 'SOLICITADO', '', NULL, '2026-05-08 16:27:51.107', '2026-05-08 16:27:51.107');

-- --------------------------------------------------------

--
-- Estrutura para tabela `auditoria`
--

CREATE TABLE `auditoria` (
  `id` varchar(191) NOT NULL,
  `usuario_id` varchar(191) NOT NULL,
  `entidade` varchar(191) NOT NULL,
  `entidade_id` varchar(191) NOT NULL,
  `acao` enum('CREATE','UPDATE','DELETE','LOGIN','STATUS_CHANGE') NOT NULL,
  `dados` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`dados`)),
  `criado_em` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `auditoria`
--

INSERT INTO `auditoria` (`id`, `usuario_id`, `entidade`, `entidade_id`, `acao`, `dados`, `criado_em`) VALUES
('cmox4i72h000ev5ec14z3vmje', 'cmou7ikm60001v5asr3ywnj2u', 'Availability', 'cmou7ikm60001v5asr3ywnj2u', 'CREATE', '{\"generated\":3,\"weekStartDate\":\"2026-05-11\"}', '2026-05-08 16:22:17.418'),
('cmox4nzf1000iv5ecb6mbbok6', 'cmou7ikmd0002v5asqpwf6f36', 'Appointment', 'cmox4nzew000gv5ecjfet4gxb', 'CREATE', '{\"protocolCode\":\"AGE-2026-00001\",\"status\":\"SOLICITADO\"}', '2026-05-08 16:26:47.437'),
('cmox4olms000kv5ecny76nr6j', 'cmou7ikm60001v5asr3ywnj2u', 'Appointment', 'cmox4nzew000gv5ecjfet4gxb', 'STATUS_CHANGE', '{\"protocolCode\":\"AGE-2026-00001\",\"status\":\"APROVADO\"}', '2026-05-08 16:27:16.228'),
('cmox4pcjt000ov5ectt4266fa', 'cmou7ikmd0002v5asqpwf6f36', 'Appointment', 'cmox4pcjn000mv5ecerly1b4a', 'CREATE', '{\"protocolCode\":\"AGE-2026-00002\",\"status\":\"SOLICITADO\"}', '2026-05-08 16:27:51.113'),
('cmox8sazq0001v568yqe1jh35', 'cmou7ikm60001v5asr3ywnj2u', 'User', 'cmou7ikm60001v5asr3ywnj2u', 'LOGIN', '{\"at\":\"2026-05-08T18:22:07.525Z\"}', '2026-05-08 18:22:07.527'),
('cmp1awebq0001v5m04uiq07yg', 'cmou7ikmd0002v5asqpwf6f36', 'User', 'cmou7ikmd0002v5asqpwf6f36', 'LOGIN', '{\"at\":\"2026-05-11T14:32:22.403Z\"}', '2026-05-11 14:32:22.405'),
('cmp1baoym0003v5m0nghom53y', 'cmou7ikm60001v5asr3ywnj2u', 'User', 'cmou7ikm60001v5asr3ywnj2u', 'LOGIN', '{\"at\":\"2026-05-11T14:43:29.373Z\"}', '2026-05-11 14:43:29.375');

-- --------------------------------------------------------

--
-- Estrutura para tabela `disponibilidade_agenda`
--

CREATE TABLE `disponibilidade_agenda` (
  `id` varchar(191) NOT NULL,
  `extensionista_id` varchar(191) NOT NULL,
  `inicio` datetime(3) NOT NULL,
  `fim` datetime(3) NOT NULL,
  `capacidade` int(11) NOT NULL DEFAULT 1,
  `observacoes` varchar(191) DEFAULT NULL,
  `criado_em` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `atualizado_em` datetime(3) NOT NULL,
  `municipio_id` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `disponibilidade_agenda`
--

INSERT INTO `disponibilidade_agenda` (`id`, `extensionista_id`, `inicio`, `fim`, `capacidade`, `observacoes`, `criado_em`, `atualizado_em`, `municipio_id`) VALUES
('cmox4i72f000av5ec95vfy58r', 'cmou7ikm60001v5asr3ywnj2u', '2026-05-11 11:00:00.000', '2026-05-11 12:00:00.000', 1, 'Periodo matutino 1', '2026-05-08 16:22:17.415', '2026-05-08 16:22:17.415', 'cmovu9g7p003ov5f8mnmh4zg5'),
('cmox4i72f000bv5ecg3hm7z3t', 'cmou7ikm60001v5asr3ywnj2u', '2026-05-11 17:00:00.000', '2026-05-11 18:00:00.000', 1, 'Periodo vespertino 1', '2026-05-08 16:22:17.415', '2026-05-08 16:22:17.415', 'cmovu9g7p003ov5f8mnmh4zg5'),
('cmox4i72f000cv5ec3r9rj1cl', 'cmou7ikm60001v5asr3ywnj2u', '2026-05-11 19:00:00.000', '2026-05-11 20:00:00.000', 1, 'Periodo vespertino 2', '2026-05-08 16:22:17.415', '2026-05-08 16:22:17.415', 'cmovu9g7p003ov5f8mnmh4zg5');

-- --------------------------------------------------------

--
-- Estrutura para tabela `extensionista_municipio`
--

CREATE TABLE `extensionista_municipio` (
  `id` varchar(191) NOT NULL,
  `extensionista_id` varchar(191) NOT NULL,
  `municipio_id` varchar(191) NOT NULL,
  `criado_em` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `extensionista_municipio`
--

INSERT INTO `extensionista_municipio` (`id`, `extensionista_id`, `municipio_id`, `criado_em`) VALUES
('cmox3akre0005v5ygkq3gzjad', 'cmou7ikm60001v5asr3ywnj2u', 'cmovu9g7p003ov5f8mnmh4zg5', '2026-05-08 15:48:22.298');

-- --------------------------------------------------------

--
-- Estrutura para tabela `municipio_atendimento`
--

CREATE TABLE `municipio_atendimento` (
  `id` varchar(191) NOT NULL,
  `nome` varchar(191) NOT NULL,
  `uf` varchar(191) NOT NULL DEFAULT 'MT',
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `criado_em` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `atualizado_em` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `municipio_atendimento`
--

INSERT INTO `municipio_atendimento` (`id`, `nome`, `uf`, `ativo`, `criado_em`, `atualizado_em`) VALUES
('cmovu9fxk0003v5f828mfbjtu', 'Cláudia', 'MT', 1, '2026-05-07 18:47:46.664', '2026-05-07 18:47:46.664'),
('cmovu9fxp0004v5f8sd84tnvz', 'Feliz Natal', 'MT', 1, '2026-05-07 18:47:46.669', '2026-05-07 18:47:46.669'),
('cmovu9fxv0005v5f8u5bk1a2f', 'Ipiranga do Norte', 'MT', 1, '2026-05-07 18:47:46.675', '2026-05-07 18:47:46.675'),
('cmovu9fxy0006v5f85ubfy6m7', 'Itanhangá', 'MT', 1, '2026-05-07 18:47:46.678', '2026-05-07 18:47:46.678'),
('cmovu9fy00007v5f8jd1tcv0z', 'Itaúba', 'MT', 1, '2026-05-07 18:47:46.681', '2026-05-07 18:47:46.681'),
('cmovu9fy40008v5f8cihuu7v9', 'Lucas do Rio Verde', 'MT', 1, '2026-05-07 18:47:46.685', '2026-05-07 18:47:46.685'),
('cmovu9fy70009v5f85tkuy8rd', 'Marcelândia', 'MT', 1, '2026-05-07 18:47:46.688', '2026-05-07 18:47:46.688'),
('cmovu9fya000av5f8rmlzbjul', 'Nova Mutum', 'MT', 1, '2026-05-07 18:47:46.691', '2026-05-07 18:47:46.691'),
('cmovu9fyd000bv5f8yot5vk88', 'Nova Fronteira', 'MT', 1, '2026-05-07 18:47:46.693', '2026-05-07 18:47:46.693'),
('cmovu9fyf000cv5f85mboesnj', 'Nova Ubiratã', 'MT', 1, '2026-05-07 18:47:46.695', '2026-05-07 18:47:46.695'),
('cmovu9fyh000dv5f8bnbkkv02', 'Nova Santa Helena', 'MT', 1, '2026-05-07 18:47:46.698', '2026-05-07 18:47:46.698'),
('cmovu9fyl000ev5f8a78xqzrd', 'Santa Rita do Trivelato', 'MT', 1, '2026-05-07 18:47:46.702', '2026-05-07 18:47:46.702'),
('cmovu9fyo000fv5f8ixakq4bi', 'Santa Carmem', 'MT', 1, '2026-05-07 18:47:46.705', '2026-05-07 18:47:46.705'),
('cmovu9fyq000gv5f8vu94xnm7', 'Sinop', 'MT', 1, '2026-05-07 18:47:46.707', '2026-05-07 18:47:46.707'),
('cmovu9fyt000hv5f8l1mp51oa', 'Sorriso', 'MT', 1, '2026-05-07 18:47:46.709', '2026-05-07 18:47:46.709'),
('cmovu9fyw000iv5f8an5xhbus', 'Tabaporã', 'MT', 1, '2026-05-07 18:47:46.712', '2026-05-07 18:47:46.712'),
('cmovu9fz0000jv5f8j6jtib6m', 'Tapurah', 'MT', 1, '2026-05-07 18:47:46.716', '2026-05-07 18:47:46.716'),
('cmovu9fz3000kv5f843jv1vwe', 'União do Sul', 'MT', 1, '2026-05-07 18:47:46.719', '2026-05-07 18:47:46.719'),
('cmovu9fz5000lv5f8eqdpw6yn', 'Vera', 'MT', 1, '2026-05-07 18:47:46.722', '2026-05-07 18:47:46.722'),
('cmovu9fz8000mv5f87bs1lw72', 'Alto Paraguai e Distrito de Capão Verde', 'MT', 1, '2026-05-07 18:47:46.724', '2026-05-07 18:47:46.724'),
('cmovu9fza000nv5f8wy6xqiqh', 'Arenápolis', 'MT', 1, '2026-05-07 18:47:46.727', '2026-05-07 18:47:46.727'),
('cmovu9fzd000ov5f8bus6e0s6', 'Barra do Bugres', 'MT', 1, '2026-05-07 18:47:46.729', '2026-05-07 18:47:46.729'),
('cmovu9fzg000pv5f803bleqdg', 'Campo Novo do Parecis', 'MT', 1, '2026-05-07 18:47:46.732', '2026-05-07 18:47:46.732'),
('cmovu9fzj000qv5f84ys80yco', 'Capão Verde/Alto Paraguai', 'MT', 1, '2026-05-07 18:47:46.735', '2026-05-07 18:47:46.735'),
('cmovu9fzm000rv5f8gegswdpa', 'Denise', 'MT', 1, '2026-05-07 18:47:46.738', '2026-05-07 18:47:46.738'),
('cmovu9fzp000sv5f8wve1s53h', 'Diamantino', 'MT', 1, '2026-05-07 18:47:46.741', '2026-05-07 18:47:46.741'),
('cmovu9fzr000tv5f8aumrifa0', 'Nortelândia', 'MT', 1, '2026-05-07 18:47:46.744', '2026-05-07 18:47:46.744'),
('cmovu9fzt000uv5f8vr1d9fpz', 'Nova Marilândia', 'MT', 1, '2026-05-07 18:47:46.746', '2026-05-07 18:47:46.746'),
('cmovu9fzw000vv5f84unjlud1', 'Nova Maringá', 'MT', 1, '2026-05-07 18:47:46.749', '2026-05-07 18:47:46.749'),
('cmovu9g00000wv5f8g50qfmb1', 'Nova Olímpia', 'MT', 1, '2026-05-07 18:47:46.752', '2026-05-07 18:47:46.752'),
('cmovu9g03000xv5f84v7jm8o0', 'Porto Estrela', 'MT', 1, '2026-05-07 18:47:46.755', '2026-05-07 18:47:46.755'),
('cmovu9g05000yv5f8n3qh7u9e', 'São José do Rio Claro', 'MT', 1, '2026-05-07 18:47:46.757', '2026-05-07 18:47:46.757'),
('cmovu9g07000zv5f8h9fow035', 'Tangará da Serra', 'MT', 1, '2026-05-07 18:47:46.760', '2026-05-07 18:47:46.760'),
('cmovu9g0a0010v5f8gum5xiqx', 'Santo Afonso', 'MT', 1, '2026-05-07 18:47:46.762', '2026-05-07 18:47:46.762'),
('cmovu9g0c0011v5f85lrfj0tk', 'Sapezal', 'MT', 1, '2026-05-07 18:47:46.764', '2026-05-07 18:47:46.764'),
('cmovu9g0f0012v5f8plsunbx9', 'Alto Boa Vista', 'MT', 1, '2026-05-07 18:47:46.768', '2026-05-07 18:47:46.768'),
('cmovu9g0i0013v5f85saa3vcm', 'Bom Jesus do Araguaia', 'MT', 1, '2026-05-07 18:47:46.770', '2026-05-07 18:47:46.770'),
('cmovu9g0l0014v5f848awo603', 'Canabrava do Norte', 'MT', 1, '2026-05-07 18:47:46.773', '2026-05-07 18:47:46.773'),
('cmovu9g0n0015v5f8jw84x42b', 'Confresa', 'MT', 1, '2026-05-07 18:47:46.775', '2026-05-07 18:47:46.775'),
('cmovu9g0q0016v5f8oedrvc03', 'Luciara', 'MT', 1, '2026-05-07 18:47:46.778', '2026-05-07 18:47:46.778'),
('cmovu9g0s0017v5f82nrxo0lg', 'Novo Santo Antônio', 'MT', 1, '2026-05-07 18:47:46.781', '2026-05-07 18:47:46.781'),
('cmovu9g0w0018v5f8bcnj9yz7', 'Porto Alegre do Norte', 'MT', 1, '2026-05-07 18:47:46.784', '2026-05-07 18:47:46.784'),
('cmovu9g0z0019v5f8kft8z39o', 'Santa Cruz do Xingu', 'MT', 1, '2026-05-07 18:47:46.787', '2026-05-07 18:47:46.787'),
('cmovu9g12001av5f8e0pg3dtu', 'Santa Terezinha', 'MT', 1, '2026-05-07 18:47:46.790', '2026-05-07 18:47:46.790'),
('cmovu9g14001bv5f86ggh2vhb', 'São Félix do Araguaia', 'MT', 1, '2026-05-07 18:47:46.792', '2026-05-07 18:47:46.792'),
('cmovu9g16001cv5f8o6jy1vum', 'São José do Xingu', 'MT', 1, '2026-05-07 18:47:46.795', '2026-05-07 18:47:46.795'),
('cmovu9g19001dv5f8pkbsv5te', 'Serra Nova Dourada', 'MT', 1, '2026-05-07 18:47:46.798', '2026-05-07 18:47:46.798'),
('cmovu9g1d001ev5f8cnbfpt40', 'Vila Rica', 'MT', 1, '2026-05-07 18:47:46.801', '2026-05-07 18:47:46.801'),
('cmovu9g1g001fv5f8m5rk26j1', 'Cáceres', 'MT', 1, '2026-05-07 18:47:46.804', '2026-05-07 18:47:46.804'),
('cmovu9g1i001gv5f82s24fk2v', 'Araputanga', 'MT', 1, '2026-05-07 18:47:46.807', '2026-05-07 18:47:46.807'),
('cmovu9g1l001hv5f8mukf5t1p', 'Campos de Júlio', 'MT', 1, '2026-05-07 18:47:46.809', '2026-05-07 18:47:46.809'),
('cmovu9g1n001iv5f8yog94uot', 'Comodoro', 'MT', 1, '2026-05-07 18:47:46.812', '2026-05-07 18:47:46.812'),
('cmovu9g1q001jv5f8kc9xavzk', 'Conquista D\'Oeste', 'MT', 1, '2026-05-07 18:47:46.814', '2026-05-07 18:47:46.814'),
('cmovu9g1u001kv5f89shxbbg2', 'Curvelândia', 'MT', 1, '2026-05-07 18:47:46.818', '2026-05-07 18:47:46.818'),
('cmovu9g1x001lv5f8oe62i4yj', 'Figueirópolis D\'Oeste', 'MT', 1, '2026-05-07 18:47:46.821', '2026-05-07 18:47:46.821'),
('cmovu9g1z001mv5f8cl8e5jcv', 'Glória D\'Oeste', 'MT', 1, '2026-05-07 18:47:46.824', '2026-05-07 18:47:46.824'),
('cmovu9g22001nv5f8eu4qqrao', 'Jauru', 'MT', 1, '2026-05-07 18:47:46.826', '2026-05-07 18:47:46.826'),
('cmovu9g24001ov5f8izos8vex', 'Indavaí', 'MT', 1, '2026-05-07 18:47:46.829', '2026-05-07 18:47:46.829'),
('cmovu9g27001pv5f83wn0waj9', 'Lambari D\'Oeste', 'MT', 1, '2026-05-07 18:47:46.831', '2026-05-07 18:47:46.831'),
('cmovu9g2a001qv5f8fr7l8tvx', 'Mirassol D\'Oeste', 'MT', 1, '2026-05-07 18:47:46.835', '2026-05-07 18:47:46.835'),
('cmovu9g2d001rv5f8s73qstnf', 'Nova Lacerda', 'MT', 1, '2026-05-07 18:47:46.838', '2026-05-07 18:47:46.838'),
('cmovu9g2g001sv5f8lvh7a0h7', 'Pontes e Lacerda', 'MT', 1, '2026-05-07 18:47:46.840', '2026-05-07 18:47:46.840'),
('cmovu9g2j001tv5f8tiqn8w86', 'Porto Esperidião', 'MT', 1, '2026-05-07 18:47:46.843', '2026-05-07 18:47:46.843'),
('cmovu9g2l001uv5f86mqx8vpm', 'Reserva do Cabaçal', 'MT', 1, '2026-05-07 18:47:46.845', '2026-05-07 18:47:46.845'),
('cmovu9g2n001vv5f825bxma11', 'Rio Branco', 'MT', 1, '2026-05-07 18:47:46.848', '2026-05-07 18:47:46.848'),
('cmovu9g2r001wv5f8wo7axknf', 'Salto do Céu', 'MT', 1, '2026-05-07 18:47:46.851', '2026-05-07 18:47:46.851'),
('cmovu9g2t001xv5f8b3bqxjmr', 'São José dos Quatro Marcos', 'MT', 1, '2026-05-07 18:47:46.854', '2026-05-07 18:47:46.854'),
('cmovu9g2w001yv5f8aynnra4f', 'Vale de São Domingos', 'MT', 1, '2026-05-07 18:47:46.856', '2026-05-07 18:47:46.856'),
('cmovu9g2y001zv5f87phfp9af', 'Vila Bela da Santíssima Trindade', 'MT', 1, '2026-05-07 18:47:46.859', '2026-05-07 18:47:46.859'),
('cmovu9g300020v5f8besdwfbj', 'Alta Floresta', 'MT', 1, '2026-05-07 18:47:46.861', '2026-05-07 18:47:46.861'),
('cmovu9g320021v5f85w4r8l7u', 'Apiacás', 'MT', 1, '2026-05-07 18:47:46.863', '2026-05-07 18:47:46.863'),
('cmovu9g360022v5f86lswdyv1', 'Carlinda', 'MT', 1, '2026-05-07 18:47:46.866', '2026-05-07 18:47:46.866'),
('cmovu9g390023v5f8ftsyccvh', 'Colíder', 'MT', 1, '2026-05-07 18:47:46.869', '2026-05-07 18:47:46.869'),
('cmovu9g3c0024v5f8udmcd70l', 'Guarantã do Norte', 'MT', 1, '2026-05-07 18:47:46.872', '2026-05-07 18:47:46.872'),
('cmovu9g3e0025v5f85kudtomt', 'Matupá', 'MT', 1, '2026-05-07 18:47:46.874', '2026-05-07 18:47:46.874'),
('cmovu9g3g0026v5f82qkxyoxw', 'Nova Bandeirantes', 'MT', 1, '2026-05-07 18:47:46.877', '2026-05-07 18:47:46.877'),
('cmovu9g3i0027v5f8fh7t6y20', 'Nova Canaã do Norte', 'MT', 1, '2026-05-07 18:47:46.879', '2026-05-07 18:47:46.879'),
('cmovu9g3m0028v5f8ec0meozo', 'Nova Guarita', 'MT', 1, '2026-05-07 18:47:46.882', '2026-05-07 18:47:46.882'),
('cmovu9g3p0029v5f8dugzydwz', 'Nova Monte Verde', 'MT', 1, '2026-05-07 18:47:46.885', '2026-05-07 18:47:46.885'),
('cmovu9g3s002av5f8k2ua0x2g', 'Novo Mundo', 'MT', 1, '2026-05-07 18:47:46.889', '2026-05-07 18:47:46.889'),
('cmovu9g3v002bv5f8pgle25a8', 'Peixoto de Azevedo', 'MT', 1, '2026-05-07 18:47:46.892', '2026-05-07 18:47:46.892'),
('cmovu9g3y002cv5f8abglqm26', 'Paranaíta', 'MT', 1, '2026-05-07 18:47:46.895', '2026-05-07 18:47:46.895'),
('cmovu9g42002dv5f89qk27tte', 'Terra Nova do Norte', 'MT', 1, '2026-05-07 18:47:46.898', '2026-05-07 18:47:46.898'),
('cmovu9g45002ev5f8ha0z83kr', 'Água Boa', 'MT', 1, '2026-05-07 18:47:46.901', '2026-05-07 18:47:46.901'),
('cmovu9g48002fv5f8kcq7a4y3', 'Araguainha', 'MT', 1, '2026-05-07 18:47:46.905', '2026-05-07 18:47:46.905'),
('cmovu9g4b002gv5f8l8iati38', 'Araguaiana', 'MT', 1, '2026-05-07 18:47:46.907', '2026-05-07 18:47:46.907'),
('cmovu9g4d002hv5f8t2rsthn4', 'Barra do Garças', 'MT', 1, '2026-05-07 18:47:46.910', '2026-05-07 18:47:46.910'),
('cmovu9g4g002iv5f8k9upzc3z', 'Campinápolis', 'MT', 1, '2026-05-07 18:47:46.912', '2026-05-07 18:47:46.912'),
('cmovu9g4i002jv5f8zp8l2zgs', 'Canarana', 'MT', 1, '2026-05-07 18:47:46.915', '2026-05-07 18:47:46.915'),
('cmovu9g4l002kv5f8urhkrslf', 'Cocalinho', 'MT', 1, '2026-05-07 18:47:46.918', '2026-05-07 18:47:46.918'),
('cmovu9g4o002lv5f88tdhl77a', 'General Carneiro', 'MT', 1, '2026-05-07 18:47:46.921', '2026-05-07 18:47:46.921'),
('cmovu9g4r002mv5f899wyrwwr', 'Nova Xavantina', 'MT', 1, '2026-05-07 18:47:46.923', '2026-05-07 18:47:46.923'),
('cmovu9g4t002nv5f8j0dtaq8d', 'Novo São Joaquim', 'MT', 1, '2026-05-07 18:47:46.926', '2026-05-07 18:47:46.926'),
('cmovu9g4w002ov5f8df2caa1t', 'Pontal do Araguaia', 'MT', 1, '2026-05-07 18:47:46.928', '2026-05-07 18:47:46.928'),
('cmovu9g4y002pv5f8zh5nv15h', 'Ponte Branca', 'MT', 1, '2026-05-07 18:47:46.931', '2026-05-07 18:47:46.931'),
('cmovu9g51002qv5f8q2vvk5m1', 'Querência', 'MT', 1, '2026-05-07 18:47:46.934', '2026-05-07 18:47:46.934'),
('cmovu9g54002rv5f8xdu7mf0o', 'Ribeirão Cascalheira', 'MT', 1, '2026-05-07 18:47:46.937', '2026-05-07 18:47:46.937'),
('cmovu9g57002sv5f8kzgugrd6', 'Ribeirãozinho', 'MT', 1, '2026-05-07 18:47:46.939', '2026-05-07 18:47:46.939'),
('cmovu9g59002tv5f8oa047tdv', 'Gaúcha do Norte', 'MT', 1, '2026-05-07 18:47:46.941', '2026-05-07 18:47:46.941'),
('cmovu9g5c002uv5f8n5r2fh0z', 'Torixoréu', 'MT', 1, '2026-05-07 18:47:46.944', '2026-05-07 18:47:46.944'),
('cmovu9g5e002vv5f8viqkeau6', 'Alto Araguaia', 'MT', 1, '2026-05-07 18:47:46.947', '2026-05-07 18:47:46.947'),
('cmovu9g5h002wv5f8mk6jmapt', 'Alto Taquari', 'MT', 1, '2026-05-07 18:47:46.950', '2026-05-07 18:47:46.950'),
('cmovu9g5k002xv5f860gukw80', 'Alto Garças', 'MT', 1, '2026-05-07 18:47:46.953', '2026-05-07 18:47:46.953'),
('cmovu9g5n002yv5f8ykappa3y', 'Campo Verde', 'MT', 1, '2026-05-07 18:47:46.956', '2026-05-07 18:47:46.956'),
('cmovu9g5q002zv5f8zqrrkpam', 'Dom Aquino', 'MT', 1, '2026-05-07 18:47:46.958', '2026-05-07 18:47:46.958'),
('cmovu9g5s0030v5f8wo2uw3b5', 'Guiratinga', 'MT', 1, '2026-05-07 18:47:46.961', '2026-05-07 18:47:46.961'),
('cmovu9g5u0031v5f87bdl31qx', 'Itiquira', 'MT', 1, '2026-05-07 18:47:46.963', '2026-05-07 18:47:46.963'),
('cmovu9g5x0032v5f8g1v69sal', 'Jaciara', 'MT', 1, '2026-05-07 18:47:46.966', '2026-05-07 18:47:46.966'),
('cmovu9g600033v5f8lfpwvywo', 'Juscimeira', 'MT', 1, '2026-05-07 18:47:46.969', '2026-05-07 18:47:46.969'),
('cmovu9g630034v5f8hoos6z8h', 'Paranatinga', 'MT', 1, '2026-05-07 18:47:46.972', '2026-05-07 18:47:46.972'),
('cmovu9g660035v5f8yb8ri6e4', 'Pedra Preta', 'MT', 1, '2026-05-07 18:47:46.974', '2026-05-07 18:47:46.974'),
('cmovu9g680036v5f8u6vqn9ul', 'Poxoréu', 'MT', 1, '2026-05-07 18:47:46.976', '2026-05-07 18:47:46.976'),
('cmovu9g6a0037v5f84cbnvzqm', 'Primavera do Leste', 'MT', 1, '2026-05-07 18:47:46.979', '2026-05-07 18:47:46.979'),
('cmovu9g6d0038v5f8kh85v6py', 'Rondonópolis', 'MT', 1, '2026-05-07 18:47:46.981', '2026-05-07 18:47:46.981'),
('cmovu9g6g0039v5f8lpjgrzg8', 'Santo Antônio do Leste', 'MT', 1, '2026-05-07 18:47:46.985', '2026-05-07 18:47:46.985'),
('cmovu9g6k003av5f8hjjqwmgi', 'São José do Povo', 'MT', 1, '2026-05-07 18:47:46.988', '2026-05-07 18:47:46.988'),
('cmovu9g6n003bv5f8g8ysslsp', 'São Pedro da Cipa', 'MT', 1, '2026-05-07 18:47:46.991', '2026-05-07 18:47:46.991'),
('cmovu9g6q003cv5f82b27yjas', 'Tesouro', 'MT', 1, '2026-05-07 18:47:46.994', '2026-05-07 18:47:46.994'),
('cmovu9g6t003dv5f88we8rqtg', 'Juína', 'MT', 1, '2026-05-07 18:47:46.997', '2026-05-07 18:47:46.997'),
('cmovu9g6w003ev5f8yl2dlq9c', 'Aripuanã', 'MT', 1, '2026-05-07 18:47:47.000', '2026-05-07 18:47:47.000'),
('cmovu9g6z003fv5f8gukhchyz', 'Brasnorte', 'MT', 1, '2026-05-07 18:47:47.003', '2026-05-07 18:47:47.003'),
('cmovu9g72003gv5f8udbzp9fa', 'Castanheira', 'MT', 1, '2026-05-07 18:47:47.006', '2026-05-07 18:47:47.006'),
('cmovu9g74003hv5f81den0wsr', 'Colniza', 'MT', 1, '2026-05-07 18:47:47.009', '2026-05-07 18:47:47.009'),
('cmovu9g77003iv5f80g35q3xb', 'Cotriguaçu', 'MT', 1, '2026-05-07 18:47:47.012', '2026-05-07 18:47:47.012'),
('cmovu9g7a003jv5f8kpro6auk', 'Juara', 'MT', 1, '2026-05-07 18:47:47.015', '2026-05-07 18:47:47.015'),
('cmovu9g7e003kv5f8umb7tvnf', 'Juruena', 'MT', 1, '2026-05-07 18:47:47.019', '2026-05-07 18:47:47.019'),
('cmovu9g7i003lv5f8ml0z553u', 'Novo Horizonte do Norte', 'MT', 1, '2026-05-07 18:47:47.022', '2026-05-07 18:47:47.022'),
('cmovu9g7k003mv5f8eu933til', 'Porto dos Gaúchos', 'MT', 1, '2026-05-07 18:47:47.025', '2026-05-07 18:47:47.025'),
('cmovu9g7n003nv5f8vyqgtg43', 'Rondolândia', 'MT', 1, '2026-05-07 18:47:47.027', '2026-05-07 18:47:47.027'),
('cmovu9g7p003ov5f8mnmh4zg5', 'Acorizal', 'MT', 1, '2026-05-07 18:47:47.030', '2026-05-07 18:47:47.030'),
('cmovu9g7s003pv5f8goi1qq30', 'Barão de Melgaço', 'MT', 1, '2026-05-07 18:47:47.033', '2026-05-07 18:47:47.033'),
('cmovu9g7w003qv5f8gzgkpd34', 'Agrovila das Palmeiras', 'MT', 1, '2026-05-07 18:47:47.036', '2026-05-07 18:47:47.036'),
('cmovu9g7z003rv5f8fy4tl6ov', 'Chapada dos Guimarães', 'MT', 1, '2026-05-07 18:47:47.039', '2026-05-07 18:47:47.039'),
('cmovu9g82003sv5f8gtafaczc', 'Cuiabá', 'MT', 1, '2026-05-07 18:47:47.042', '2026-05-07 18:47:47.042'),
('cmovu9g85003tv5f84g9jm1ql', 'Várzea Grande', 'MT', 1, '2026-05-07 18:47:47.045', '2026-05-07 18:47:47.045'),
('cmovu9g87003uv5f80r5ch1d9', 'Nobres', 'MT', 1, '2026-05-07 18:47:47.048', '2026-05-07 18:47:47.048'),
('cmovu9g8b003vv5f84i8mqi6p', 'Nossa Senhora do Livramento', 'MT', 1, '2026-05-07 18:47:47.051', '2026-05-07 18:47:47.051'),
('cmovu9g8d003wv5f8c0ebf2jb', 'Nova Brasilândia', 'MT', 1, '2026-05-07 18:47:47.054', '2026-05-07 18:47:47.054'),
('cmovu9g8g003xv5f8maex8r87', 'Poconé', 'MT', 1, '2026-05-07 18:47:47.057', '2026-05-07 18:47:47.057'),
('cmovu9g8j003yv5f8bfaxwtpp', 'Rosário Oeste', 'MT', 1, '2026-05-07 18:47:47.059', '2026-05-07 18:47:47.059'),
('cmovu9g8l003zv5f8zaklo50o', 'Santo Antônio de Leverger', 'MT', 1, '2026-05-07 18:47:47.061', '2026-05-07 18:47:47.061'),
('cmovu9g8n0040v5f8kdgsjfgx', 'Planalto da Serra', 'MT', 1, '2026-05-07 18:47:47.063', '2026-05-07 18:47:47.063');

-- --------------------------------------------------------

--
-- Estrutura para tabela `notificacao`
--

CREATE TABLE `notificacao` (
  `id` varchar(191) NOT NULL,
  `usuario_id` varchar(191) NOT NULL,
  `titulo` varchar(191) NOT NULL,
  `mensagem` text NOT NULL,
  `lido_em` datetime(3) DEFAULT NULL,
  `criado_em` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `propriedade`
--

CREATE TABLE `propriedade` (
  `id` varchar(191) NOT NULL,
  `proprietario_id` varchar(191) NOT NULL,
  `nome_proprietario` varchar(191) NOT NULL,
  `documento_proprietario` varchar(191) NOT NULL,
  `registro_rural` varchar(191) DEFAULT NULL,
  `codigo_funrural` varchar(191) DEFAULT NULL,
  `nome_exibicao` varchar(191) NOT NULL,
  `municipio` varchar(191) NOT NULL,
  `uf` varchar(191) NOT NULL,
  `endereco` varchar(191) DEFAULT NULL,
  `possui_habite_se` tinyint(1) NOT NULL DEFAULT 0,
  `criado_em` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `atualizado_em` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `propriedade`
--

INSERT INTO `propriedade` (`id`, `proprietario_id`, `nome_proprietario`, `documento_proprietario`, `registro_rural`, `codigo_funrural`, `nome_exibicao`, `municipio`, `uf`, `endereco`, `possui_habite_se`, `criado_em`, `atualizado_em`) VALUES
('seed-propriedade-solicitante-padrao', 'cmou7ikmd0002v5asqpwf6f36', 'Solicitante Padrao', '22222222222', NULL, NULL, 'Fazenda Modelo', 'Cuiaba', 'MT', 'Comunidade Teste', 0, '2026-05-08 12:20:35.663', '2026-05-08 12:20:35.663');

-- --------------------------------------------------------

--
-- Estrutura para tabela `servico`
--

CREATE TABLE `servico` (
  `id` varchar(191) NOT NULL,
  `nome` varchar(191) NOT NULL,
  `descricao` varchar(191) DEFAULT NULL,
  `duracao_minutos` int(11) NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `criado_em` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `atualizado_em` datetime(3) NOT NULL,
  `classificacao` varchar(191) NOT NULL DEFAULT 'Outros atendimentos'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `servico`
--

INSERT INTO `servico` (`id`, `nome`, `descricao`, `duracao_minutos`, `ativo`, `criado_em`, `atualizado_em`, `classificacao`) VALUES
('seed-servico-acoes-coletivas', 'Orientacoes sobre acoes coletivas ou em comunidade', NULL, 60, 1, '2026-05-06 20:10:31.062', '2026-05-07 18:47:47.100', 'Associacoes, cooperativas e comunidade'),
('seed-servico-agroindustria-animal', 'Orientacoes sobre regularizacao de agroindustria de produtos de origem animal', NULL, 60, 1, '2026-05-06 20:10:31.039', '2026-05-07 18:47:47.077', 'Agroindustria'),
('seed-servico-agroindustria-vegetal', 'Orientacoes sobre regularizacao de agroindustria de produtos de origem vegetal', NULL, 60, 1, '2026-05-06 20:10:31.042', '2026-05-07 18:47:47.079', 'Agroindustria'),
('seed-servico-artesanatos', 'Orientacoes sobre producao e venda de artesanatos', NULL, 60, 1, '2026-05-06 20:10:31.120', '2026-05-07 18:47:47.157', 'Turismo rural'),
('seed-servico-atividade-turistica', 'Orientacoes sobre organizacao da atividade turistica com produtos, cultura e paisagem local', NULL, 60, 1, '2026-05-06 20:10:31.118', '2026-05-07 18:47:47.155', 'Turismo rural'),
('seed-servico-boas-praticas-fabricacao', 'Orientacoes sobre boas praticas de fabricacao', NULL, 60, 1, '2026-05-06 20:10:31.034', '2026-05-07 18:47:47.072', 'Agroindustria'),
('seed-servico-caf-associacao', 'Fazer ou atualizar o CAF da associacao ou cooperativa', NULL, 60, 1, '2026-05-06 20:10:31.069', '2026-05-07 18:47:47.107', 'CAF - Cadastro da Agricultura Familiar'),
('seed-servico-caf-individual', 'Fazer ou atualizar o CAF individual', NULL, 60, 1, '2026-05-06 20:10:31.071', '2026-05-07 18:47:47.109', 'CAF - Cadastro da Agricultura Familiar'),
('seed-servico-caf-orientacoes', 'Orientacoes sobre o CAF', NULL, 60, 1, '2026-05-06 20:10:31.074', '2026-05-07 18:47:47.111', 'CAF - Cadastro da Agricultura Familiar'),
('seed-servico-colheita-venda', 'Orientacoes sobre colheita, beneficiamentos e venda', NULL, 60, 1, '2026-05-06 20:10:31.055', '2026-05-07 18:47:47.092', 'Assistencia tecnica produtiva VEGETAL'),
('seed-servico-criar-associacao', 'Orientacoes sobre criacao ou regularizacao de associacao ou cooperativa', NULL, 60, 1, '2026-05-06 20:10:31.064', '2026-05-07 18:47:47.102', 'Associacoes, cooperativas e comunidade'),
('seed-servico-dividas-credito', 'Orientacao e renegociacao de dividas de credito', NULL, 60, 1, '2026-05-06 20:10:31.098', '2026-05-07 18:47:47.136', 'Credito e financiamento rural'),
('seed-servico-fco-rural', 'Orientacao e elaboracao de projeto de financiamento FCO Rural', NULL, 60, 1, '2026-05-06 20:10:31.086', '2026-05-07 18:47:47.124', 'Credito e financiamento rural'),
('seed-servico-feiras-mercados', 'Orientacoes para venda em feiras ou mercados privados', NULL, 60, 1, '2026-05-06 20:10:31.079', '2026-05-07 18:47:47.117', 'Comercializacao e mercados institucionais - PNAE PAA e outros'),
('seed-servico-fomento-fundaaf', 'Orientacoes e elaboracao de projeto de fomento FUNDAAF 2.2 - Inclusao Rural', NULL, 60, 1, '2026-05-06 20:10:31.101', '2026-05-07 18:47:47.138', 'Fomento produtivo e inclusao rural'),
('seed-servico-fomento-incra', 'Orientacoes e elaboracao de projeto de fomento rural INCRA', NULL, 60, 1, '2026-05-06 20:10:31.106', '2026-05-07 18:47:47.143', 'Fomento produtivo e inclusao rural'),
('seed-servico-fomento-mds', 'Orientacoes e elaboracao de projeto de Fomento MDS', NULL, 60, 1, '2026-05-06 20:10:31.103', '2026-05-07 18:47:47.140', 'Fomento produtivo e inclusao rural'),
('seed-servico-fundaaf-agroindustria', 'Orientacao e elaboracao de projeto de financiamento FUNDAAF 2.1 - Agroindustria', NULL, 60, 1, '2026-05-06 20:10:31.088', '2026-05-07 18:47:47.126', 'Credito e financiamento rural'),
('seed-servico-fundaaf-incentivo', 'Orientacao e elaboracao de projeto de financiamento FUNDAAF 2.1 - Incentivo Produtivo', NULL, 60, 1, '2026-05-06 20:10:31.091', '2026-05-07 18:47:47.128', 'Credito e financiamento rural'),
('seed-servico-gado-leite-corte', 'Orientacoes sobre gado de leite ou de corte', NULL, 60, 1, '2026-05-06 20:10:31.049', '2026-05-07 18:47:47.087', 'Assistencia tecnica produtiva ANIMAL'),
('seed-servico-gestao-agricola', 'Orientacao de gestao do negocio agricola', NULL, 60, 1, '2026-05-06 20:10:31.052', '2026-05-07 18:47:47.089', 'Assistencia tecnica produtiva VEGETAL'),
('seed-servico-gestao-associacao', 'Orientacoes sobre gestao da associacao ou cooperativa', NULL, 60, 1, '2026-05-06 20:10:31.066', '2026-05-07 18:47:47.104', 'Associacoes, cooperativas e comunidade'),
('seed-servico-gestao-pecuaria', 'Orientacao de gestao do negocio pecuario', NULL, 60, 1, '2026-05-06 20:10:31.045', '2026-05-07 18:47:47.082', 'Assistencia tecnica produtiva ANIMAL'),
('seed-servico-instalacoes-e-equipamentos', 'Orientacoes sobre adequacao de instalacoes e equipamentos', NULL, 60, 1, '2026-05-06 20:10:31.032', '2026-05-07 18:47:47.069', 'Agroindustria'),
('seed-servico-lavoura-manejo', 'Orientacoes sobre iniciar lavoura, manejo de solo, pragas, doencas e tratos culturais', NULL, 60, 1, '2026-05-06 20:10:31.057', '2026-05-07 18:47:47.094', 'Assistencia tecnica produtiva VEGETAL'),
('seed-servico-limite-credito', 'Atualizacao de cadastro ou limite de credito', NULL, 60, 1, '2026-05-06 20:10:31.083', '2026-05-07 18:47:47.122', 'Credito e financiamento rural'),
('seed-servico-lixo-residuos', 'Orientacoes sobre destinacao de lixo, residuos e efluentes', NULL, 60, 1, '2026-05-06 20:10:31.109', '2026-05-07 18:47:47.145', 'Meio ambiente e sustentabilidade rural'),
('seed-servico-mt-produtivo', 'Orientacoes e elaboracao de plano de negocio para o MT PRODUTIVO', NULL, 60, 1, '2026-05-06 20:10:31.060', '2026-05-07 18:47:47.097', 'Associacoes, cooperativas e comunidade'),
('seed-servico-nascentes-rio-represa', 'Orientacoes sobre uso e protecao de nascentes, rio ou represa', NULL, 60, 1, '2026-05-06 20:10:31.113', '2026-05-07 18:47:47.150', 'Meio ambiente e sustentabilidade rural'),
('seed-servico-outros-animais', 'Orientacoes sobre aves, suinos, peixes, abelhas ou outros animais', NULL, 60, 1, '2026-05-06 20:10:31.047', '2026-05-07 18:47:47.084', 'Assistencia tecnica produtiva ANIMAL'),
('seed-servico-outros-atendimentos', 'Emissao de declaracoes, laudos tecnicos, parecer tecnico, consultas documentais, outras politicas publicas, etc', NULL, 60, 1, '2026-05-06 20:10:31.116', '2026-05-07 18:47:47.153', 'Outros atendimentos'),
('seed-servico-projeto-venda-pnae-paa', 'Elaboracao do projeto de venda para PNAE, PAA ou outro orgao publico', NULL, 60, 1, '2026-05-06 20:10:31.077', '2026-05-07 18:47:47.114', 'Comercializacao e mercados institucionais - PNAE PAA e outros'),
('seed-servico-pronaf', 'Orientacao e elaboracao de projeto de financiamento PRONAF', NULL, 60, 1, '2026-05-06 20:10:31.093', '2026-05-07 18:47:47.131', 'Credito e financiamento rural'),
('seed-servico-pronamp', 'Orientacao e elaboracao de projeto de financiamento PRONAMP', NULL, 60, 1, '2026-05-06 20:10:31.096', '2026-05-07 18:47:47.134', 'Credito e financiamento rural'),
('seed-servico-regularizacao-ambiental', 'Orientacoes sobre regularizacao ambiental, APF, CAR, PRA ou licenciamento', NULL, 60, 1, '2026-05-06 20:10:31.111', '2026-05-07 18:47:47.147', 'Meio ambiente e sustentabilidade rural'),
('seed-servico-rotulo-embalagens', 'Orientacoes sobre construir ou ajustar rotulo de embalagens', NULL, 60, 1, '2026-05-06 20:10:31.037', '2026-05-07 18:47:47.075', 'Agroindustria'),
('seed-servico-siapp', 'Elaboracao de cadastro no SIAPP', NULL, 60, 1, '2026-05-06 20:10:31.025', '2026-05-07 18:47:47.066', 'Agroindustria'),
('seed-servico-vender-paa-pnae', 'Orientacoes para vender ao PAA, PNAE ou Orgao Publico', NULL, 60, 1, '2026-05-06 20:10:31.081', '2026-05-07 18:47:47.119', 'Comercializacao e mercados institucionais - PNAE PAA e outros'),
('seed-vistoria-inicial', 'Vistoria inicial', 'Atendimento padrao para vistoria tecnica', 60, 0, '2026-05-06 15:23:15.306', '2026-05-07 18:47:46.659', 'Outros atendimentos');

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuario`
--

CREATE TABLE `usuario` (
  `id` varchar(191) NOT NULL,
  `nome` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `documento` varchar(191) NOT NULL,
  `senha_hash` varchar(191) NOT NULL,
  `telefone` varchar(191) DEFAULT NULL,
  `perfil` enum('SOLICITANTE','EXTENSIONISTA','ADMINISTRADOR') NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `criado_em` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `atualizado_em` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `usuario`
--

INSERT INTO `usuario` (`id`, `nome`, `email`, `documento`, `senha_hash`, `telefone`, `perfil`, `ativo`, `criado_em`, `atualizado_em`) VALUES
('cmou7iklz0000v5asp13h1mdb', 'Administrador Inicial', 'admin@agendamento.local', '00000000000', 'af68de74ccf12852a13d684989934df8:135d696cdbad606a0ed831ba62e4920911cc9c4e91807f574e048cabeca60847d6e652b280d985558f2332d1eb3311b999bc9413b7a4a74f76975c1c04e9a1d8', NULL, 'ADMINISTRADOR', 1, '2026-05-06 15:23:15.287', '2026-05-06 15:23:15.287'),
('cmou7ikm60001v5asr3ywnj2u', 'Extensionista Padrao', 'extensionista@agendamento.local', '11111111111', 'af68de74ccf12852a13d684989934df8:135d696cdbad606a0ed831ba62e4920911cc9c4e91807f574e048cabeca60847d6e652b280d985558f2332d1eb3311b999bc9413b7a4a74f76975c1c04e9a1d8', '65999999999', 'EXTENSIONISTA', 1, '2026-05-06 15:23:15.294', '2026-05-07 18:57:38.025'),
('cmou7ikmd0002v5asqpwf6f36', 'Solicitante Padrao', 'solicitante@agendamento.local', '22222222222', 'af68de74ccf12852a13d684989934df8:135d696cdbad606a0ed831ba62e4920911cc9c4e91807f574e048cabeca60847d6e652b280d985558f2332d1eb3311b999bc9413b7a4a74f76975c1c04e9a1d8', '65988888888', 'SOLICITANTE', 1, '2026-05-06 15:23:15.302', '2026-05-06 15:23:15.302');

-- --------------------------------------------------------

--
-- Estrutura para tabela `_prisma_migrations`
--

CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `_prisma_migrations`
--

INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
('0ca8987e-d0d0-4a29-93d0-0295a1c9a5e0', '900c8e9d18d8c16125b36ddea55c9166bee195552f336e32911676270c15bfe1', '2026-05-07 19:02:15.416', '20260507161000_remover_escritorio_atendimento', NULL, NULL, '2026-05-07 19:02:15.212', 1),
('16c8133e-8ff1-491c-8ee6-c4f13707dc42', 'da9e429efe16e6eeb735319294c0bac47974af2d326503311ae42128aa596f6c', '2026-05-06 15:22:57.205', '20260506120000_base_portugues', NULL, NULL, '2026-05-06 15:22:56.557', 1),
('526413ad-edce-40c0-81ab-63c2343c49f4', '672d68e3d60a88f3b8f79321355ac09d041269d406fc382270ae078b5efc695f', '2026-05-07 18:05:28.224', '20260507152000_pontos_atendimento_extensionista', NULL, NULL, '2026-05-07 18:05:28.035', 1),
('89061335-a607-41ea-8c0e-967b60425597', 'b3063bf85cec1fbdadd3c8706d9714ed708e594e8ee7494ed9fd6b80ab5aa11c', '2026-05-07 19:24:37.370', '20260507163000_extensionista_multiplos_municipios', NULL, NULL, '2026-05-07 19:24:37.150', 1),
('ad15c90f-05ec-4ff0-b392-6b2c2ef384a5', 'f5bb557396c262f1d193201b9a540bce6b9b78a2489e47ceed43e2505ad8da57', '2026-05-06 20:10:10.942', '20260506133000_servico_classificacao', NULL, NULL, '2026-05-06 20:10:10.911', 1),
('d391c9b0-81cb-45fe-b6ca-63d571b9a030', 'a753f9a4c5a08746045f546c5b18ed31b1474df56c1b8edd671e1833f7919158', '2026-05-08 11:51:15.496', '20260508102000_disponibilidade_municipio_obrigatorio', NULL, NULL, '2026-05-08 11:51:15.496', 1),
('ebc5a12b-02b2-4835-bd58-42a88d5a130d', '6d1bc11af4f18ff6e0f1173b5455274d1f9d4ad92dad9227d277b588eb94c510', '2026-05-07 14:57:35.236', '20260507143000_remover_anexo', NULL, NULL, '2026-05-07 14:57:35.219', 1);

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `agendamento`
--
ALTER TABLE `agendamento`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `agendamento_codigo_protocolo_key` (`codigo_protocolo`),
  ADD KEY `agendamento_solicitante_criado_em_idx` (`solicitante_id`,`criado_em`),
  ADD KEY `agendamento_extensionista_inicio_idx` (`extensionista_id`,`inicio_agendado`),
  ADD KEY `agendamento_disponibilidade_id_idx` (`disponibilidade_id`),
  ADD KEY `agendamento_status_criado_em_idx` (`status`,`criado_em`),
  ADD KEY `agendamento_servico_id_idx` (`servico_id`),
  ADD KEY `agendamento_propriedade_id_idx` (`propriedade_id`);

--
-- Índices de tabela `auditoria`
--
ALTER TABLE `auditoria`
  ADD PRIMARY KEY (`id`),
  ADD KEY `auditoria_usuario_criado_em_idx` (`usuario_id`,`criado_em`),
  ADD KEY `auditoria_entidade_entidade_id_idx` (`entidade`,`entidade_id`);

--
-- Índices de tabela `disponibilidade_agenda`
--
ALTER TABLE `disponibilidade_agenda`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `disponibilidade_extensionista_inicio_key` (`extensionista_id`,`inicio`),
  ADD KEY `disponibilidade_extensionista_inicio_idx` (`extensionista_id`,`inicio`),
  ADD KEY `disponibilidade_inicio_idx` (`inicio`),
  ADD KEY `disponibilidade_municipio_inicio_idx` (`municipio_id`,`inicio`);

--
-- Índices de tabela `extensionista_municipio`
--
ALTER TABLE `extensionista_municipio`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `extensionista_municipio_unique` (`extensionista_id`,`municipio_id`),
  ADD KEY `extensionista_municipio_municipio_id_idx` (`municipio_id`);

--
-- Índices de tabela `municipio_atendimento`
--
ALTER TABLE `municipio_atendimento`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `municipio_atendimento_nome_uf_key` (`nome`,`uf`),
  ADD KEY `municipio_atendimento_ativo_idx` (`ativo`);

--
-- Índices de tabela `notificacao`
--
ALTER TABLE `notificacao`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notificacao_usuario_criado_em_idx` (`usuario_id`,`criado_em`),
  ADD KEY `notificacao_lido_em_idx` (`lido_em`);

--
-- Índices de tabela `propriedade`
--
ALTER TABLE `propriedade`
  ADD PRIMARY KEY (`id`),
  ADD KEY `propriedade_proprietario_id_idx` (`proprietario_id`),
  ADD KEY `propriedade_municipio_uf_idx` (`municipio`,`uf`);

--
-- Índices de tabela `servico`
--
ALTER TABLE `servico`
  ADD PRIMARY KEY (`id`),
  ADD KEY `servico_ativo_idx` (`ativo`),
  ADD KEY `servico_nome_idx` (`nome`),
  ADD KEY `servico_classificacao_idx` (`classificacao`);

--
-- Índices de tabela `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_email_key` (`email`),
  ADD UNIQUE KEY `usuario_documento_key` (`documento`);

--
-- Índices de tabela `_prisma_migrations`
--
ALTER TABLE `_prisma_migrations`
  ADD PRIMARY KEY (`id`);

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `agendamento`
--
ALTER TABLE `agendamento`
  ADD CONSTRAINT `agendamento_disponibilidade_id_fkey` FOREIGN KEY (`disponibilidade_id`) REFERENCES `disponibilidade_agenda` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `agendamento_extensionista_id_fkey` FOREIGN KEY (`extensionista_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `agendamento_propriedade_id_fkey` FOREIGN KEY (`propriedade_id`) REFERENCES `propriedade` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `agendamento_servico_id_fkey` FOREIGN KEY (`servico_id`) REFERENCES `servico` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `agendamento_solicitante_id_fkey` FOREIGN KEY (`solicitante_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `auditoria`
--
ALTER TABLE `auditoria`
  ADD CONSTRAINT `auditoria_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `disponibilidade_agenda`
--
ALTER TABLE `disponibilidade_agenda`
  ADD CONSTRAINT `disponibilidade_agenda_extensionista_id_fkey` FOREIGN KEY (`extensionista_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `disponibilidade_agenda_municipio_id_fkey` FOREIGN KEY (`municipio_id`) REFERENCES `municipio_atendimento` (`id`) ON UPDATE CASCADE;

--
-- Restrições para tabelas `extensionista_municipio`
--
ALTER TABLE `extensionista_municipio`
  ADD CONSTRAINT `extensionista_municipio_extensionista_id_fkey` FOREIGN KEY (`extensionista_id`) REFERENCES `usuario` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `extensionista_municipio_municipio_id_fkey` FOREIGN KEY (`municipio_id`) REFERENCES `municipio_atendimento` (`id`) ON UPDATE CASCADE;

--
-- Restrições para tabelas `notificacao`
--
ALTER TABLE `notificacao`
  ADD CONSTRAINT `notificacao_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `propriedade`
--
ALTER TABLE `propriedade`
  ADD CONSTRAINT `propriedade_proprietario_id_fkey` FOREIGN KEY (`proprietario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

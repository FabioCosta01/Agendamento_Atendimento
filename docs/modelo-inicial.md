# Modelo Inicial

## Entidades principais

- `User`: usuarios do sistema com perfil `SOLICITANTE`, `EXTENSIONISTA` ou `ADMINISTRADOR`
- `Service`: tipos de atendimento oferecidos
- `Property`: imoveis ou propriedades vinculadas ao solicitante
- `Availability`: blocos de horario disponibilizados pelo extensionista
- `Appointment`: pedido ou agendamento confirmado
- `Attachment`: anexos do atendimento
- `AuditLog`: trilha de auditoria

## Regras iniciais

- Todo agendamento gera um `protocolCode` unico.
- O backend concentra validacoes criticas e transicoes de status.
- O extensionista pode abrir blocos com capacidade configuravel.
- O solicitante escolhe propriedade, servico e data preferencial.
- O administrador gerencia servicos, usuarios e configuracoes.

## Status do agendamento

- `SOLICITADO`
- `APROVADO`
- `REAGENDADO`
- `CANCELADO`
- `CONCLUIDO`

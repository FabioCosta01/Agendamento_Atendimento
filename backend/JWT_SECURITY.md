# 🔐 Configuração JWT Segura

Este documento descreve como configurar a autenticação JWT de forma segura para produção.

## 📋 Pré-requisitos

- JWT_SECRET deve ter pelo menos 32 caracteres
- Deve conter letras maiúsculas, minúsculas, números e caracteres especiais
- Nunca use valores padrão ou previsíveis

## ⚙️ Configuração

### 1. Arquivo .env

```bash
# Desenvolvimento
NODE_ENV="development"
JWT_SECRET="sua-chave-segura-aqui"
JWT_EXPIRES_IN="8h"
JWT_ISSUER="agendamento-atendimento"
JWT_AUDIENCE="agendamento-atendimento-client"
```

```bash
# Produção
NODE_ENV="production"
JWT_SECRET="E=s{z=A)yEe<K@5Ea01eEAR,Cm@)cktS&(4!mRf]*T:)kSFc=E&6OLenn9LnRvFe"
JWT_EXPIRES_IN="1h"
JWT_ISSUER="agendamento-atendimento"
JWT_AUDIENCE="agendamento-atendimento-client"
```

### 2. Validação Automática

A aplicação valida automaticamente o JWT_SECRET na inicialização:

```bash
npm run validate-jwt  # Validação manual
npm run dev          # Validação automática no desenvolvimento
npm run start        # Validação automática na produção
```

### 3. Critérios de Segurança

✅ **Comprimento mínimo**: 32 caracteres
✅ **Caracteres diversos**: Maiúsculas, minúsculas, números, especiais
✅ **Não hardcoded**: Sempre via variável de ambiente
✅ **Validação na inicialização**: Aplicação não inicia com segredo inválido
✅ **Expiração configurável**: 8h desenvolvimento, 1h produção
✅ **Algoritmo seguro**: HS256
✅ **Issuer/Audience**: Validação adicional

## 🚨 Segurança em Produção

### Headers de Segurança
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy` (produção)
- `Strict-Transport-Security` (produção)

### Rate Limiting
- 100 requisições por IP a cada 15 minutos (produção)
- 1000 requisições por IP a cada 15 minutos (desenvolvimento)

### Logs de Segurança
- Tentativas de acesso sem token
- Tokens inválidos/expirados
- Rate limiting excedido
- Requisições suspeitas

## 🔍 Monitoramento

### Verificar Status JWT
```bash
npm run validate-jwt
```

### Logs de Segurança
Monitore os logs da aplicação para:
- Tentativas de acesso não autorizado
- Tokens expirados
- Rate limiting
- Atividades suspeitas

## 🚫 Não Faça

❌ **Nunca** commite JWT_SECRET no código
❌ **Nunca** use valores padrão em produção
❌ **Nunca** exponha JWT_SECRET em logs/respostas
❌ **Nunca** use JWT_SECRET curto ou previsível
❌ **Nunca** desabilite validações em produção

## 🔄 Rotação de Chaves

Para rotacionar JWT_SECRET:

1. Configure novo segredo nas variáveis de ambiente
2. Reinicie a aplicação
3. Os tokens antigos serão invalidados automaticamente
4. Usuários precisarão fazer login novamente

## 📞 Suporte

Em caso de problemas com JWT:
1. Execute `npm run validate-jwt` para diagnóstico
2. Verifique logs da aplicação
3. Confirme configuração das variáveis de ambiente
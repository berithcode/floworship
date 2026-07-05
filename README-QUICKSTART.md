# 🚀 Floworship - Quick Start

## Portas Utilizadas

| Serviço | Porta | URL |
|---------|-------|-----|
| **Frontend Web** | 5174 | http://localhost:5174 |
| **API Backend** | 4001 | http://localhost:4001/api |
| **Database** | - | SQLite (file:./dev.db) |

> ⚠️ **Nota**: Se houver conflito de portas, altere em:
> - `.env` (VITE_API_URL)
> - `apps/web/vite.config.ts` (server.port)
> - `apps/api/src/index.ts` (PORT)

---

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Instalar dependências do frontend e API
npm install --prefix apps/web
npm install --prefix apps/api
```

---

## 🏃 Desenvolvimento

### Terminal 1 - API Backend
```bash
cd apps/api
npm run dev
# → http://localhost:4001/api
```

### Terminal 2 - Frontend Web
```bash
cd apps/web
npm run dev
# → http://localhost:5174
```

### Ou usar Turborepo (recomendado)
```bash
# Na raiz do projeto
npm run dev
# → Roda API e Frontend simultaneamente
```

---

## 🧪 Builds

```bash
# Build completo
npm run build

# Build apenas API
npm run build:api

# Build apenas Frontend
npm run build:web
```

---

## 🗄️ Database

```bash
# Push schema para SQLite (dev)
npx prisma db push

# Seed do banco
npx prisma db seed

# Studio (GUI)
npx prisma studio
```

---

## 🔑 Credenciais de Teste

### Admin
- Email: `admin@floworship.com`
- Senha: `admin123`

### Músico (via convite)
- Telefone: `+5511999999999`
- PIN: `123456`

---

## 📱 Rotas Principais

| Rota | Descrição |
|------|-----------|
| `/login` | Login de admin ou músico |
| `/dashboard` | Dashboard principal |
| `/team` | Gestão de equipe (admin) |
| `/schedules` | Escalas (admin) |
| `/my-schedule` | Minha escala (músico) |
| `/library` | Biblioteca de músicas |
| `/settings` | Configurações |

---

## 🛠️ Stack

- **Frontend**: React 18, TypeScript, TailwindCSS, Vite
- **Backend**: Fastify, TypeScript, Prisma ORM
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Auth**: JWT + Cookies HTTP-only
- **Integrações**: Telegram Bot, WhatsApp (meta-cloud-api)

---

## 📝 Notas

- **Ambiente de desenvolvimento**: Use `npm run dev` para hot-reload
- **Migrations destrutivas**: OK em dev (`--accept-data-loss`)
- **Build em produção**: Use `npm run build` antes de deploy

---

**Versão**: 8.0.0  
**Última atualização**: 2026-07-03  
**Status**: ✅ Fase 5 Completa
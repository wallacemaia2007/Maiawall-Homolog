# Maiawall Homolog API

Backend Node.js + Express + MongoDB para o painel de homologacao da Maiawall.

## Stack

- Node.js
- Express
- MongoDB Atlas ou MongoDB local
- MongoDB native driver
- JWT
- bcryptjs
- zod
- dotenv
- cors
- express-rate-limit

## Ambiente

Crie `backend/.env` a partir de `.env.example`.

```env
PORT=3000
NODE_ENV=production
APP_ENV=production
JWT_SECRET=replace-with-a-secure-secret
MONGODB_URI=
MONGODB_DB_NAME=maiawall_homolog
FRONTEND_URL=http://localhost:4200
CORS_ORIGINS=http://localhost:4200
```

Para desenvolvimento local, use `backend/.env.local.example` como referencia. O script `npm run dev` usa Mongo local em `maiawall_homolog_local` por padrao.

## Comandos

```bash
cd backend
npm install
npm run dev
npm start
npm run seed
```

O seed nao roda automaticamente. Ele limpa e recria somente as colecoes do Maiawall Homolog. Fora de `local`, `development`, `dev` ou `test`, defina `CONFIRM_SEED="SEED <nome-do-banco>"` antes de executar.

Credenciais de desenvolvimento criadas pelo seed:

- ADMIN: `admin@maiawall.com` / `Admin@123`
- CLIENT: `cliente@maiawall.com` / `Cliente@123`

## Respostas

Sucesso:

```json
{ "success": true, "data": {} }
```

Erro:

```json
{ "success": false, "message": "Projeto nao encontrado" }
```

## Auth

`POST /api/auth/login`

```json
{
  "email": "cliente@maiawall.com",
  "password": "Cliente@123"
}
```

Resposta:

```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "csrfToken": "...",
    "user": {
      "id": "...",
      "name": "Cliente Maiawall",
      "email": "cliente@maiawall.com",
      "role": "CLIENT",
      "active": true
    }
  }
}
```

O token tambem e enviado em cookie HttpOnly `mw_session`. Mutações autenticadas via cookie precisam enviar `X-CSRF-Token` com o valor de `csrfToken` ou do cookie legivel `mw_csrf`. O backend tambem aceita `Authorization: Bearer <token>` para testes e integracoes server-to-server.

## Endpoints

Auth:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`

Users:

- `GET /api/users/me`
- `GET /api/users` ADMIN

Projects:

- `GET /api/projects`
- `GET /api/projects/:id`
- `POST /api/projects` ADMIN
- `PUT /api/projects/:id` ADMIN
- `PATCH /api/projects/:id` ADMIN
- `DELETE /api/projects/:id` ADMIN
- `GET /api/projects/:id/activities`
- `GET /api/projects/:id/releases`
- `GET /api/projects/:id/commits`
- `GET /api/projects/:id/investments`
- `POST /api/projects/:id/approve`
- `POST /api/projects/:id/request-changes`

Investments:

- `GET /api/investments`
- `GET /api/investments/:id`
- `POST /api/investments` ADMIN
- `GET /api/investments/:id/installments`
- `POST /api/investments/:id/installments` ADMIN
- `PATCH /api/installments/:id` ADMIN
- `DELETE /api/installments/:id` ADMIN

Notifications:

- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`

Health:

- `GET /api/health/storage`

## Regras implementadas

- `CLIENT` ve apenas seus proprios projetos, investimentos e notificacoes.
- `ADMIN` ve todos os projetos, usuarios e dados financeiros.
- Projeto principal usa `isPrimary` e o backend remove o principal anterior do mesmo cliente.
- `progress` e validado de 0 a 100.
- Aprovacao so e aceita para projetos em `HOMOLOGATION` ou `CHANGES_REQUESTED`.
- Solicitacao de alteracoes registra atividade e muda status para `CHANGES_REQUESTED`.
- Valores financeiros derivados (`paidAmount`, `remainingAmount`, `paidInstallments`, `remainingInstallments`) sao calculados a partir das parcelas.

## MongoDB Atlas

Use a connection string Atlas em `MONGODB_URI` e defina `APP_ENV=production`. Nao coloque credenciais no codigo. Para ambiente local, o guard bloqueia bancos com nomes de producao e Mongo remoto, a menos que `ALLOW_REMOTE_MONGO_IN_LOCAL=true` seja definido conscientemente.

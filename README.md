# Sistema de Autenticación JWT

## Requisitos
- Node.js
- PostgreSQL
- Postman/Insomnia para pruebas

## Instalación
1. Clonar repositorio
2. `npm install`
3. Crear base de datos PostgreSQL llamada `auth_jwt`
4. Configurar `.env` con tus credenciales

## Endpoints
- POST `/register` (requiere token)
- POST `/login` (genera token)
- GET `/me` (requiere token)

## Pruebas
Importar `postman_collection.json` en Postman

## Ejemplos de uso

1. Prueba de Login (POST /login)

- Caso exitoso:

Método: POST

URL: http://localhost:3000/login

Headers: Content-Type: application/json

Body (raw - JSON):

{
  "email": "usuario@ejemplo.com",
  "password": "password123"
}

2. Prueba de Registro (POST /register)

- Caso exitoso:

Método: POST

URL: http://localhost:3000/register

Headers:

Content-Type: application/json

Authorization: Bearer <token-obtenido-del-login>

Body (raw - JSON):

{
  "username": "nuevousuario",
  "email": "nuevo@ejemplo.com",
  "password": "password123"
}

3. Prueba de Información de Usuario (GET /me)

- Caso exitoso:

Método: GET

URL: http://localhost:3000/me

Headers:

Authorization: Bearer <token-obtenido-del-login>
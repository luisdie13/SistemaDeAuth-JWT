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
Importar `postman_collection.json` en Postman/Insomnia
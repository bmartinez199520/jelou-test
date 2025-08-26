# API de Gestión de Tareas con NestJS

API RESTful desarrollada con NestJS para la gestión de tareas, con autenticación JWT, caché Redis y persistencia en MySQL.

## Características

- ✅ CRUD completo para tareas
- 🔒 Autenticación con JWT
- 🗄️ Persistencia en MySQL
- 📝 Soft delete y restauración de tareas
- 🚀 Caché con Redis
- 📊 Paginación y filtrado
- 📚 Documentación con Swagger

## Requisitos previos

- Node.js (v18 o superior)
- Docker y Docker Compose
- Git

## Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd Nestjs-Test-02
```

### 2. Variables de entorno

Copia el archivo de ejemplo y configura tus variables:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus configuraciones.

### 3. Iniciar con Docker Compose

La forma más sencilla de ejecutar el proyecto es usando Docker Compose:

```bash
docker compose up -d
```

Esto iniciará:
- API NestJS en el puerto 3000
- MySQL en el puerto 3306
- Redis en el puerto 6379
- MongoDB en el puerto 27017

### 4. Instalación manual (alternativa)

Si prefieres ejecutar la aplicación localmente:

```bash
# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run start:dev

# Iniciar en modo producción
npm run start:prod
```

## Endpoints de la API

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/login` | Iniciar sesión y obtener token JWT |

**Ejemplo de solicitud:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña"
}
```

### Usuarios

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/users/register` | Registrar un nuevo usuario |

**Ejemplo de solicitud:**
```json
{
  "name": "Usuario Ejemplo",
  "email": "usuario@ejemplo.com",
  "password": "contraseña"
}
```

### Tareas (requieren autenticación)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/tasks` | Listar todas las tareas (con paginación) |
| GET | `/tasks?status=pending` | Filtrar tareas por estado |
| GET | `/tasks/:id` | Obtener una tarea por ID |
| POST | `/tasks` | Crear una nueva tarea |
| PUT | `/tasks/:id` | Actualizar una tarea existente |
| DELETE | `/tasks/:id/soft` | Eliminar una tarea (soft delete) |
| DELETE | `/tasks/:id/permanent` | Eliminar una tarea permanentemente |
| PUT | `/tasks/:id/restore` | Restaurar una tarea eliminada |

**Ejemplo para crear una tarea:**
```json
{
  "title": "Completar documentación",
  "description": "Finalizar la documentación del proyecto"
}
```

## Estructura del proyecto

```
src/
├── auth/               # Autenticación y seguridad
├── cache/              # Configuración de caché Redis
├── config/             # Configuraciones de la aplicación
├── database/           # Migraciones y configuración de BD
├── tasks/              # Módulo de tareas (controladores, servicios, etc.)
├── users/              # Módulo de usuarios
└── app.module.ts       # Módulo principal
```

## Pruebas

```bash
# Pruebas unitarias
npm run test

# Pruebas e2e
npm run test:e2e

# Cobertura de pruebas
npm run test:cov
```

## Despliegue en producción

Para desplegar en producción, puedes usar el Dockerfile incluido:

```bash
# Construir la imagen
docker build -t nestjs-tasks-api .

# Ejecutar el contenedor
docker run -p 3000:3000 --env-file .env nestjs-tasks-api
```

## Licencia

[MIT](LICENSE)

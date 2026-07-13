# Generic Full-Stack Boilerplate (NestJS + React)

A premium, production-ready full-stack template designed for speed, scalability, and modern developer experience. This monorepo provides a solid foundation with built-in authentication, role-based access control, media management, and a sleek admin portal.

## 🚀 Quick Start

This project uses a `Makefile` to simplify development tasks.

### 1. Prerequisites
- **Node.js** 20+
- **MySQL** 8+
- **Docker** (Optional)

### 2. Installation
Install dependencies for both backend and frontend:
```bash
make install
```

### 3. Environment Setup
Copy the example environment files and update them with your credentials:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 4. Running Locally
Start both the backend and frontend in development mode:
```bash
make run-all
```
- **Backend API**: `http://localhost:3003/api`
- **Frontend App**: `http://localhost:5173`
- **Swagger Docs**: `http://localhost:3003/api/docs`

## 🏗️ Architecture

### Backend (NestJS)
- **Modular Design**: Domain-driven kernels for isolated business logic.
- **Authentication**: JWT-based auth with passport integration.
- **Database**: TypeORM with MySQL support.
- **Storage**: Integrated with Cloudinary and AWS S3.
- **Safety**: Global exception filters and standardized API responses.

### Frontend (React)
- **Modern Stack**: React 19, Vite, and TailwindCSS v4.
- **State Management**: Zustand for light, reactive global state.
- **Data Fetching**: Custom API hooks (`useApiQuery`, `useApiMutation`) using Axios.
- **UI System**: Premium, custom-built components with rich aesthetics.

## 🛠️ Commands

| Command | Description |
|---------|-------------|
| `make install` | Install all dependencies |
| `make run-backend` | Start NestJS in watch mode |
| `make run-frontend` | Start Vite dev server |
| `make run-all` | Start both concurrently |
| `make docker-up` | Start everything with Docker Compose |
| `make build-backend` | Create production backend build |

## 🛡️ License

This project is licensed under the MIT License.

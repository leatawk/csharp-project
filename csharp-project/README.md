# csharp-project

This project contains one React frontend using Create React App and one C# ASP.NET Core backend.

```text
csharp-project/
  frontend/  React + Create React App frontend
  backend/   C# ASP.NET Core 8 backend
```

## Start MongoDB

Make sure MongoDB is running locally, or update `backend/.env` with your MongoDB connection string.

## Run backend

```powershell
cd backend
dotnet restore
dotnet run --urls http://localhost:5000
```

## Run frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm start
```

Frontend URL:

```text
http://localhost:3000
```

Backend API URL:

```text
http://localhost:5000/api
```

## Environment files

This project includes only `.env` files, not `.env.example` files.

```text
backend/.env
frontend/.env
```

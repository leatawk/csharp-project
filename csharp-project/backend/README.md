# csharp-project Backend - ASP.NET Core C#

This folder replaces the original Node/Express backend with an ASP.NET Core 8 minimal API backend.
It keeps the same `/api/...` routes used by the existing React frontend.

## Run

```powershell
cd backend
copy .env.example .env
# edit .env if your MongoDB URL/database is different
dotnet restore
dotnet run --urls http://localhost:5000
```

The React frontend expects:

```text
http://localhost:5000/api
```

## Notes

- MongoDB collection names match the original Mongoose backend: `users`, `roscagroups`, `memberships`, `contributions`, `fundrotations`, `notifications`, `messages`, `disputes`, and `auditlogs`.
- Passwords are stored using BCrypt.

# IPInfo HTTP Server

## Run

```powershell
go run .
```

## Client

```text
http://localhost:8080/client/
```

The client demonstrates all server endpoints:

```text
GET  /
GET  /health
GET  /api/ip/:ip
POST /api/ip
```

Forms are handled with JavaScript without page reload. IP fields are validated before request sending.

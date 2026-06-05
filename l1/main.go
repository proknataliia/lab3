package main

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"ipinfo-http-server/internal/config"
	"ipinfo-http-server/internal/httpapi"
	"ipinfo-http-server/internal/ipinfo"
	"ipinfo-http-server/internal/ratelimit"
	"ipinfo-http-server/internal/securitydemo"
)

func main() {
	cfg := config.Load()

	r := gin.Default()
	r.SetTrustedProxies(nil)
	r.Static("/client", "./web")
	r.Static("/security", "./security-web")

	server := httpapi.NewServer(
		ipinfo.NewClient(cfg.IPInfoAPIKey),
		ratelimit.New(cfg.RateLimitSec),
	)
	server.RegisterRoutes(r)
	securitydemo.NewServer().RegisterRoutes(r)

	httpServer := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
		IdleTimeout:  10 * time.Second,
	}

	log.Printf("Server started on http://localhost:%s", cfg.Port)
	if err := httpServer.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}

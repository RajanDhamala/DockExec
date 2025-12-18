package routes

import (
	"go-exec/internal/handlers"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine) {
	r.GET("/", handlers.BaseCode)
	r.GET("/health", handlers.HealthCheck)
	r.POST("/run", handlers.ExecuteCode)
}

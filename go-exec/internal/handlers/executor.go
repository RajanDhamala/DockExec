package handlers

import (
	"go-exec/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Request struct {
	Code     string `json:"code"`
	Language string `json:"language"`
}

func ExecuteCode(c *gin.Context) {
	var req Request
	if err := c.BindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "invalid JSON"})
		return
	}
	// Get full result
	result := services.ExecuteGoCode(req.Code)

	c.JSON(http.StatusOK, result)
}

func HealthCheck(c *gin.Context) {
	c.JSON(200, gin.H{
		"status":  "success",
		"message": "Go executor is up and running",
	})
}

func BaseCode(base *gin.Context) {
	base.JSON(200,
		gin.H{
			"status":  "up",
			"message": "Go server is up and running",
		})
}


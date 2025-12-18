
package utils

import "github.com/gin-gonic/gin"

func JSONSuccess(c *gin.Context, data any) {
	c.JSON(200, gin.H{"status": "success", "data": data})
}

func JSONError(c *gin.Context, msg string) {
	c.JSON(400, gin.H{"status": "error", "message": msg})
}

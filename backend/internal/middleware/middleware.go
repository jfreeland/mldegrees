package middleware

import (
	"log"
	"net/http"
	"strconv"
	"time"

	"githib.com/jfreeland/mldegrees/backend/api/internal/metrics"
)

type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

// LoggingMiddleware logs all HTTP requests to stdout and collects DogStatsD metrics
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Wrap the response writer to capture status code
		rw := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

		// Process the request
		next.ServeHTTP(rw, r)

		// Calculate duration
		duration := time.Since(start)
		statusCode := strconv.Itoa(rw.statusCode)

		// Log the completed request if it's not the health check endpoint
		if r.URL.Path != "/api/health" {
			remoteAddr := r.RemoteAddr
			if forwardedFor := r.Header.Get("X-Forwarded-For"); forwardedFor != "" {
				remoteAddr = forwardedFor
			}
			log.Printf("%s - %s %s %d %v", remoteAddr, r.Method, r.URL.Path, rw.statusCode, duration)
		}

		// Record metrics
		metrics.RecordHTTPRequest(r.Method, r.URL.Path, statusCode, duration)
	})
}

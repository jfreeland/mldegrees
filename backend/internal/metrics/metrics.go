package metrics

import (
	"log"
	"os"
	"time"

	"github.com/DataDog/datadog-go/v5/statsd"
)

var client *statsd.Client

// Initialize sets up the DogStatsD client
func Initialize() error {
	// Get DogStatsD address from environment, default to localhost:8125
	addr := os.Getenv("DD_AGENT_HOST")
	if addr == "" {
		addr = "localhost"
	}
	port := os.Getenv("DD_DOGSTATSD_PORT")
	if port == "" {
		port = "8125"
	}

	var err error
	client, err = statsd.New(addr+":"+port, statsd.WithTags([]string{
		"service:mldegrees-backend",
		"env:production",
	}))
	if err != nil {
		return err
	}

	log.Printf("DogStatsD client initialized, sending to %s:%s", addr, port)
	return nil
}

// Close closes the DogStatsD client
func Close() {
	if client != nil {
		client.Close()
	}
}

// RecordHTTPRequest records HTTP request metrics
func RecordHTTPRequest(method, endpoint, statusCode string, duration time.Duration) {
	if client == nil {
		return
	}

	tags := []string{
		"method:" + method,
		"endpoint:" + endpoint,
		"status_code:" + statusCode,
	}

	// Increment request counter
	client.Incr("http.requests.total", tags, 1)

	// Record request duration
	client.Timing("http.request.duration", duration, tags, 1)
}

// RecordDatabaseQuery records database query metrics
func RecordDatabaseQuery(operation string, duration time.Duration, success bool) {
	if client == nil {
		return
	}

	status := "success"
	if !success {
		status = "error"
	}

	tags := []string{
		"operation:" + operation,
		"status:" + status,
	}

	client.Incr("database.queries.total", tags, 1)
	client.Timing("database.query.duration", duration, tags, 1)
}

// RecordAuthEvent records authentication events
func RecordAuthEvent(event, provider string, success bool) {
	if client == nil {
		return
	}

	status := "success"
	if !success {
		status = "failure"
	}

	tags := []string{
		"event:" + event,
		"provider:" + provider,
		"status:" + status,
	}

	client.Incr("auth.events.total", tags, 1)
}

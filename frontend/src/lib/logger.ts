type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, message, context, error } = entry;

    if (this.isDevelopment) {
      // Simple format for development
      return `[${timestamp}] ${level.toUpperCase()}: ${message}${context ? ` ${JSON.stringify(context)}` : ''}${error ? ` ${error.stack}` : ''}`;
    }

    // Structured JSON format for production
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...(context && { context }),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      }),
    });
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
    };

    const formattedMessage = this.formatLogEntry(entry);

    // Always log to console in production for stdout capture
    if (this.isProduction || this.isDevelopment) {
      switch (level) {
        case 'debug':
          console.debug(formattedMessage);
          break;
        case 'info':
          console.info(formattedMessage);
          break;
        case 'warn':
          console.warn(formattedMessage);
          break;
        case 'error':
          console.error(formattedMessage);
          break;
      }
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>, error?: Error) {
    this.log('error', message, context, error);
  }

  // API call logging
  apiCall(method: string, url: string, status: number, duration: number, context?: Record<string, any>) {
    this.info(`API ${method} ${url} ${status} in ${duration}ms`, {
      type: 'api_call',
      method,
      url,
      status,
      duration,
      ...context,
    });
  }

  // Page view logging
  pageView(route: string, context?: Record<string, any>) {
    this.info(`Page view: ${route}`, {
      type: 'page_view',
      route,
      ...context,
    });
  }

  // User action logging
  userAction(action: string, context?: Record<string, any>) {
    this.info(`User action: ${action}`, {
      type: 'user_action',
      action,
      ...context,
    });
  }
}

export const logger = new Logger();

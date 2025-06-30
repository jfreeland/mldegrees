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
  private isEdgeRuntime = process.env.NEXT_RUNTIME === 'edge';

  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, message, context, error } = entry;

    if (this.isDevelopment) {
      // Simple format for development
      return `${timestamp} ${message}${context ? ` ${JSON.stringify(context)}` : ''}${error ? ` ${error.stack}` : ''}`;
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
    const now = new Date();
    const timestamp = `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const entry: LogEntry = {
      timestamp,
      level,
      message,
      context,
      error,
    };

    const formattedMessage = this.formatLogEntry(entry);

    // Always log to console in production for stdout capture
    if (this.isProduction || this.isDevelopment) {
      const c = console as any;
      // Use original console methods to avoid double JSON encoding
      const originalMethod = c[`original${level.charAt(0).toUpperCase() + level.slice(1)}`];
      if (originalMethod) {
        originalMethod(formattedMessage);
      } else {
        // Use console methods directly to avoid double JSON encoding
        console[level](formattedMessage);
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

}

export const logger = new Logger();

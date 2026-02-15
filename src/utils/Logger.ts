export class Logger {
    private static formatMessage(level: string, message: string): string {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level}] ${message}`;
    }

    static info(message: string): void {
        console.log(this.formatMessage("INFO", message));
    }

    static error(message: string, error?: any): void {
        console.error(this.formatMessage("ERROR", message));
        if (error) {
            console.error(error);
        }
    }

    static debug(message: string): void {
        console.log(this.formatMessage("DEBUG", message));
    }
}

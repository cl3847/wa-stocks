export type LoggerType = {
    (...args: any[]): void;
    error(...args: any[]): void;
    warn(...args: any[]): void;
    success(...args: any[]): void;
    info(...args: any[]): void;
};

export default LoggerType;
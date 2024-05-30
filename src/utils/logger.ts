import LoggerType from "../models/LoggerType";

class Logger {
    private static instance: Logger;
    colors: Record<string, string> = {
        red: "\u001b[31m",
        cyan: "\u001b[36m",
        white: "\u001b[37m",
        green: "\u001b[32m",
        yellow: "\u001b[33m"
    };

    public static initialize(): LoggerType {
        this.instance || (this.instance = new Logger());
        return Object.assign(
            (...args: any[]) => this.instance.call("white", ...args),
            {
                info: (...args: any[]) => this.instance.call("cyan", ...args),
                warn: (...args: any[]) => this.instance.call("yellow", ...args),
                error: (...args: any[]) => this.instance.call("red", ...args),
                success: (...args: any[]) => this.instance.call("green", ...args)
            }
        );
    };

    private call(color: string, ...args: any[]): void {
        args.unshift(this.timestamp());
        args[1] = `${this.colors[color]}${args[1]}${this.colors.white}`;
        console.log(...args);
    };

    private timestamp(): string {
        const pad = (n: number, s = 2) =>
            `${new Array(s).fill(0)}${n}`.slice(-s);
        const d = new Date();

        return `[${this.colors.cyan}${pad(d.getFullYear(), 4)}-${pad(d.getMonth() + 1)}-${pad(
            d.getDate()
        )} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(
            d.getSeconds()
        )}.${pad(d.getMilliseconds())}${this.colors.white}] |`;
    };
}

const log = Logger.initialize();
export default log;
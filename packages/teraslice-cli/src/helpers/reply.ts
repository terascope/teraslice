import chalk from 'chalk';
import { toString, get, isError } from '@terascope/core-utils';

class Reply {
    quiet = false;

    private log(msg: string) {
        // eslint-disable-next-line no-console
        console.log(msg);
    }

    formatErr(err: unknown): string {
        return toString(get(err, 'message', err));
    }

    fatal(err: unknown): never {
        if (process.env.TJM_TEST_MODE) {
            if (isError(err)) {
                throw err;
            } else {
                throw new Error(toString(err));
            }
        } else {
            console.error(chalk.red(this.formatErr(err)));
            process.exit(1);
        }
    }

    error(err: unknown): void {
        console.error(chalk.red(this.formatErr(err)));
    }

    info(message: string): void {
        if (this.quiet) return;

        this.log(toString(message));
    }

    warning(message: unknown): void {
        if (this.quiet) return;
        if (!process.env.TJM_TEST_MODE) {
            this.log(chalk.yellow(this.formatErr(message)));
        }
    }

    green(message: string): void {
        if (this.quiet) return;
        if (!process.env.TJM_TEST_MODE) {
            this.log(chalk.green(message));
        }
    }

    yellow(message: unknown): void {
        if (this.quiet) return;
        if (!process.env.TJM_TEST_MODE) {
            this.log(chalk.yellow(message));
        }
    }
}

export default new Reply();

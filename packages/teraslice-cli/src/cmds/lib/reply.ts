import chalk from 'chalk';
import { toString, get } from '@terascope/utils';

// TODO: figure this out

export default class Reply {
    private log(msg: string) {
        // eslint-disable-next-line no-console
        console.log(msg);
    }

    formatErr(err: any) {
        return toString(get(err, 'message', err));
    }

    fatal(err: any) {
        if (process.env.TJM_TEST_MODE) {
            throw new Error(err);
        } else {
            console.error(chalk.red(this.formatErr(err)));
            process.exit(1);
        }
    }

    error(err: any) {
        console.error(chalk.red(this.formatErr(err)));
    }

    info(message: string) {
        this.log(toString(message));
    }

    warning(message: any) {
        this.log(chalk.yellow(this.formatErr(message)));
    }

    green(message: string) {
        if (!process.env.TJM_TEST_MODE) {
            this.log(chalk.green(message));
        }
    }

    yellow(message: string) {
        if (!process.env.TJM_TEST_MODE) {
            this.log(chalk.yellow(message));
        }
    }
}

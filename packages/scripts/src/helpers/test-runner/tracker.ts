import ms from 'ms';
import { getFullErrorStack, isString, isFunction } from '@terascope/core-utils';
import { TestOptions, CleanupFN } from './interfaces.js';
import signale from '../signale.js';
import { formatList } from '../misc.js';

export class TestTracker {
    started = 0;
    ended = 0;
    expected = 0;

    private cleanups = new Map<string, CleanupFN>();
    private errors = new Set<string>();

    private onSIGTERM: () => void;
    private onSIGINT: () => void;
    private shuttingDown = false;

    constructor(private readonly options: TestOptions) {
        this.onSIGTERM = () => {
            process.stderr.write('\n');
            signale.info('received SIGTERM');
            this.finish();
        };

        this.onSIGINT = () => {
            process.stderr.write('\n');
            signale.info('received SIGINT');
            this.finish();
        };

        process.on('SIGINT', this.onSIGINT);
        process.on('SIGTERM', this.onSIGTERM);
    }

    hasErrors(): boolean {
        return this.errors.size > 0;
    }

    addError(error: string | any): void {
        this.errors.add(
            isString(error) ? error : getFullErrorStack(error)
        );
    }

    addCleanup(key: string, fn: CleanupFN, ...args: any[]): void {
        this.cleanups.set(key, () => fn(...args));
    }

    async runCleanupByKey(key: string): Promise<void> {
        if (!this.cleanups.has(key)) return;

        const fn = this.cleanups.get(key);
        if (!isFunction(fn)) {
            signale.warn(new Error(`Expected cleanup function for key ${key} got nothing`));
            this.cleanups.delete(key);
            return;
        }

        try {
            await fn();
            this.cleanups.delete(key);
        } catch (err) {
            signale.warn(err, `cleanup ${key} error`);
        }
    }

    async finish(): Promise<void> {
        if (this.shuttingDown) {
            await this.end(true);

            process.removeListener('SIGINT', this.onSIGINT);
            process.removeListener('SIGTERM', this.onSIGTERM);
            return;
        }

        this.shuttingDown = true;

        if (this.options.keepOpen) {
            signale.info('keeping the tests open so the services don\'t shutdown, use ctrl-c to exit.');
            const id = setTimeout(() => {
                this.end();
            }, ms('1 hour'));
            this.addCleanup('keepOpen', (timeoutId) => clearTimeout(timeoutId), id);
            return;
        }

        await this.end();
    }

    private async end(force = false) {
        if (!force) {
            const keys = [...this.cleanups.keys()];
            if (keys.length && this.options.debug) {
                signale.info('Cleaning up after tests');
            }
            for (const key of keys) {
                await this.runCleanupByKey(key);
            }
        } else {
            signale.warn('Skipping cleanup because the SIGTERM and SIGINT was called more than once');
        }

        let errorMsg = '';
        const errors = [...this.errors];
        if (errors.length > 1) {
            errorMsg = `Multiple Test Failures:${formatList(errors)}`;
        } else if (errors.length === 1) {
            ([errorMsg] = errors);
        }

        if (errors.length) {
            process.stderr.write('\n');
            signale.fatal(`${errorMsg}`);
            process.stderr.write('\n');
            const codeNum = Number(process.exitCode);
            const exitCode = (codeNum || 0) > 0 ? codeNum : 1;
            process.exit(exitCode);
        }

        if (this.started === 0 || this.expected === 0) {
            signale.warn('No tests ran');
            // if not tests are expected to run, it is safe to exit
            process.exit(this.expected === 0 ? 0 : 1);
        }

        if (this.ended !== this.expected) {
            const msg = `started: ${this.started}, completed: ${this.ended}, total: ${this.expected}`;
            signale.error(`Incomplete tests - ${msg}`);
            process.exit(1);
        }

        signale.success('All tests completed');
        process.exit(0);
    }
}

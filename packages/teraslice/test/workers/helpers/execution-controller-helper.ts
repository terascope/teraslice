import { pDelay, pDefer } from '@terascope/core-utils';

export interface MakeShutdownEarlyFnArgs {
    enabled?: boolean;
    exController: {
        shutdown: () => Promise<void>;
    };
}

export interface ShutdownFn {
    error: () => Error | { message: string };
    wait: () => Promise<void>;
    shutdown: () => Promise<void>;
}

export function makeShutdownEarlyFn(
    { exController, enabled = false }: MakeShutdownEarlyFnArgs
): ShutdownFn {
    let shutdownErr = {
        message: 'Shutdown never triggered'
    };
    let alreadyCalled = false;

    const deferred = pDefer();

    const catchShutdown = async () => {
        if (alreadyCalled) return;
        alreadyCalled = true;

        shutdownErr.message = 'Shutdown trigger but did not error';
        try {
            await exController.shutdown();
        } catch (err) {
            shutdownErr = err;
        }

        deferred.resolve();
    };

    return {
        error: () => shutdownErr,
        wait: async () => {
            if (!enabled) return;
            await deferred.promise;
        },
        shutdown: async () => {
            if (!enabled) return;

            await pDelay(100);

            catchShutdown();

            await pDelay(100);
        }
    };
}

export function getTestCases(testCases: any[]) {
    const onlyCases = testCases.filter((ts) => ts[1].only);
    if (onlyCases.length > 0) {
        console.warn(
            '[WARNING]: test cases includes a "only" property, make sure to remove this before committing'
        );
        return onlyCases;
    }

    const cases = testCases.filter((ts) => !ts[1].only);
    if (cases.length !== testCases.length) {
        console.warn(
            '[WARNING]: test cases includes a "skip" property, make sure to remove this before committing'
        );
    }
    return cases;
}

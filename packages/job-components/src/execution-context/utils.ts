import { isFunction, DataWindow } from '@terascope/utils';
import { OperationAPI, OperationAPIType } from '../operations';

export function getMetric(input: number[], i: number): number {
    const val = input && input[i];
    if (val > 0) return val;
    return 0;
}

export function isOperationAPI(api: unknown): api is OperationAPI {
    return api && typeof api === 'object' && isFunction((api as any).createAPI);
}

export function getOperationAPIType(api: unknown): OperationAPIType {
    return isOperationAPI(api) ? 'api' : 'observer';
}

type HandleFn = (input: DataWindow) => Promise<DataWindow|DataWindow[]>;

export function handleProcessorFn(handle: HandleFn) {
    return async (input: DataWindow|DataWindow[]): Promise<DataWindow|DataWindow[]> => {
        if (!input.length) {
            return handle(DataWindow.make([]));
        }

        if (DataWindow.isArray(input)) {
            const results: DataWindow[] = [];

            for (const window of input) {
                const windowResult = await handle(window);
                if (DataWindow.isArray(windowResult)) {
                    results.push(
                        ...windowResult
                    );
                } else if (DataWindow.is(windowResult)) {
                    results.push(
                        windowResult
                    );
                } else {
                    results.push(DataWindow.make(
                        windowResult,
                        window.getMetadata()
                    ));
                }
            }

            return results;
        }

        return handle(input);
    };
}

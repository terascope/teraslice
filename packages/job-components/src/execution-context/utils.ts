import { isFunction } from '@terascope/utils';
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

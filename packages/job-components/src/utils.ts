import { Context } from './interfaces/index';

export function isPromAvailable(context: Context) {
    return context.apis.foundation.promMetrics !== undefined
        && context.apis.foundation.promMetrics.verifyAPI();
}

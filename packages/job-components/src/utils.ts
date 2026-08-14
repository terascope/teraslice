import { Context } from './interfaces/index.js';

export function isPromAvailable(context: Context) {
    return context.apis.foundation.promMetrics !== undefined
        && context.apis.foundation.promMetrics.verifyAPI();
}

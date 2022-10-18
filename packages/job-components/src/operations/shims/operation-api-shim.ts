import { Context } from '../../interfaces/index.js';
import { OperationAPIConstructor } from '../interfaces.js';

export default function operationAPIShim(context: Context, apis: APIs = {}): void {
    Object.keys(apis).forEach((name) => {
        const api = apis[name];
        context.apis.executionContext.addToRegistry(name, api);
    });
}

export interface APIs {
    [name: string]: OperationAPIConstructor;
}

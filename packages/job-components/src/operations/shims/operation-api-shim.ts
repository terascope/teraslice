import { Context } from '../../interfaces';
import { OperationAPIConstructor } from '../interfaces';

export default function operationAPIShim(context: Context, apis: APIs = {}) {
    Object.keys(apis).forEach((name) => {
        const api = apis[name];
        context.apis.executionContext.addToRegistry(name, api);
    });
}

export interface APIs {
    [name: string]: OperationAPIConstructor;
}

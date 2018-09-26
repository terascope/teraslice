import each from 'lodash/each';
import { Context } from '@terascope/teraslice-types';
import { OperationAPIConstructor } from '../operation-api';

export default function operationAPIShim(context: Context, apis: APIs = {}) {
    each(apis, (api, name) => {
        context.apis.executionContext.addToRegistry(name, api);
    });
}

export interface APIs {
    [name: string]: OperationAPIConstructor;
}

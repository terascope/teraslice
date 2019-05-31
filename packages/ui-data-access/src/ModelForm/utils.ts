import { toInteger, get, isString, cloneDeep, isPlainObject } from '@terascope/utils';
import { ErrorsState, AnyModel } from './interfaces';

export function validateClientId<T extends { client_id: string | number }>(errs: ErrorsState<T>, model: T): ErrorsState<T> {
    const clientId = toInteger(model.client_id);
    if (get(model, 'type') === 'SUPERADMIN') {
        model.client_id = 0;
    } else if (clientId === false || clientId < 1) {
        errs.messages.push('Client ID must be an valid number greater than zero');
        errs.fields.push('client_id');
    } else {
        model.client_id = clientId;
    }
    return errs;
}

export function mapForeignRef(input: any): any {
    if (!input) return;
    if (Array.isArray(input)) {
        return input
            .map(val => {
                if (!val) return '';
                if (isString(val)) return val;
                return val.id;
            })
            .filter(val => !!val);
    }

    if (isString(input)) return input;
    return input.id;
}

export function prepareForMutation<T extends AnyModel>(model: T): T {
    const input = cloneDeep(model);
    return removeUnwantedProps(input);
}

const unwanted: ReadonlyArray<string> = ['__typename'];
function removeUnwantedProps<T extends any>(obj: T): T {
    if (!isPlainObject(obj)) return obj;
    for (const key of Object.keys(obj)) {
        if (unwanted.includes(key)) {
            delete obj[key];
        }
        obj[key] = removeUnwantedProps(obj[key]);
    }
    return obj;
}

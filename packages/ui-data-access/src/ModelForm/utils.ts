import { toInteger, get, isString, cloneDeep, isPlainObject, getField } from '@terascope/utils';
import { ErrorsState, AnyModel } from './interfaces';

export function validateClientId<T extends { client_id: string | number }>(errs: ErrorsState<T>, model: T): void {
    const clientId = toInteger(model.client_id);
    if (get(model, 'type') === 'SUPERADMIN') {
        model.client_id = 0;
    } else if (clientId === false || clientId < 1) {
        errs.messages.push('Client ID must be an valid number greater than zero');
        errs.fields.push('client_id');
    } else {
        model.client_id = clientId;
    }
}

export function validateName(errs: ErrorsState<any>, model: any): void {
    const name = getField(model, 'name');
    if (name == null) return;

    if (!name || !isString(name)) {
        errs.fields.push('name');
        errs.messages.push('Name must not be empty');
        return;
    }

    if (!/^[\w\d-_.\s]+$/.test(name)) {
        errs.fields.push('name');
        errs.messages.push('Name can only include alpha-numeric characters, -, _, ., and whitespace.');
    }
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

export function copyField<T extends any, P extends keyof T, V extends T[P]>(to: T, from: T, field: P, defaultVal: V) {
    to[field] = getField(from, field, defaultVal);
}

export function validateFieldName(field: any): boolean {
    if (!field) return false;
    return /^[^.][a-zA-Z0-9-_.]+[^.]$/.test(field);
}

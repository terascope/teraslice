import { toInteger, isString, cloneDeep, isPlainObject, getField, get } from '@terascope/utils';
import { ErrorsState, AnyModel } from './interfaces';

export function validateClientId<T extends { client_id: string | number }>(errs: ErrorsState<T>, model: T): void {
    const clientId = toInteger(model.client_id);
    const modelType = get(model, 'type.id', get(model, 'type'));

    if (modelType === 'SUPERADMIN') {
        if (clientId !== 0) {
            errs.messages.push('Client ID must be zero for SUPERADMIN');
            errs.fields.push('client_id');
        }
    } else if (clientId === false || clientId < 1) {
        errs.messages.push('Client ID must be an valid number greater than zero');
        errs.fields.push('client_id');
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
    return _prepareForMutation(input);
}

const unwanted: ReadonlyArray<string> = ['__typename'];
function _prepareForMutation<T extends any>(obj: T, isNested = false): T {
    if (Array.isArray(obj)) {
        return obj.map((o: any) => _prepareForMutation(o, true));
    }
    if (!isPlainObject(obj)) return obj;

    const keys = Object.keys(obj);

    // resolve any foriegn references
    if (isNested && keys.includes('id') && keys.includes('name')) {
        return mapForeignRef(obj);
    }

    for (const key of keys) {
        if (unwanted.includes(key)) {
            delete obj[key];
        }
        obj[key] = _prepareForMutation(obj[key], true);
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

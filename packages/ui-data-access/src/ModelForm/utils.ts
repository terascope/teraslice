import * as ts from '@terascope/utils';
import { ErrorsState, AnyModel, SelectOption } from './interfaces';
import { getModelType } from '../utils';

export function validateClientId<T extends { client_id: string | number }>(errs: ErrorsState<T>, model: T): void {
    const clientId = ts.toInteger(model.client_id);
    const modelType = getModelType(model);

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

export function fixClientId<T extends AnyModel>(latestModel: T): void {
    const modelType = getModelType(latestModel);
    if (modelType === 'SUPERADMIN') {
        latestModel.client_id = 0;
    } else if (typeof latestModel.client_id === 'string') {
        const int = ts.toInteger(latestModel.client_id);
        if (int !== false) latestModel.client_id = int;
    }
}

export function validateName(errs: ErrorsState<any>, model: any): void {
    const name = ts.getField(model, 'name');
    if (name == null) return;

    if (!name || !ts.isString(name)) {
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
                if (ts.isString(val)) return val;
                return val.id;
            })
            .filter(val => !!val);
    }

    if (ts.isString(input)) return input;
    return input.id;
}

export function prepareForMutation<T extends AnyModel>(model: T): T {
    const input = ts.cloneDeep(model);
    return _prepareForMutation(input);
}

const unwanted: ReadonlyArray<string> = ['__typename'];
function _prepareForMutation<T extends any>(obj: T, isNested = false): T {
    if (Array.isArray(obj)) {
        return obj.map((o: any) => _prepareForMutation(o, true));
    }
    if (!ts.isPlainObject(obj)) return obj;

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

export function getSelectValue(value?: SelectOption | SelectOption[], multiple?: boolean): string | string[] | undefined {
    if (!value) return undefined;
    if (multiple || Array.isArray(value)) {
        return ts
            .castArray(value)
            .map(val => val && val.id)
            .filter(val => !!val);
    }
    return value.id;
}

export function getSelectOptions(options?: SelectOption[]): SelectOption[] {
    if (!options) return [];
    return ts.castArray(options).filter(opt => !!opt);
}

export function mapFormOptions(options: SelectOption[], sorted?: boolean) {
    const mapped = options.map(opt => ({
        key: opt.id,
        text: opt.name || opt.id,
        value: opt.id,
    }));
    if (sorted === false) return mapped;
    return mapped.sort((a, b) => {
        const aText = ts.trimAndToLower(a.text);
        const bText = ts.trimAndToLower(b.text);
        if (aText > bText) {
            return 1;
        }
        if (aText < bText) {
            return -1;
        }
        return 0;
    });
}

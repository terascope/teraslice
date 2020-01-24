import { isString } from '@terascope/utils';

export default class FieldTransform {
    static registry = {
        uppercase: {},
        truncate: { size: 'Int' }
    }

    static uppercase(str: string) {
        if (isString(str)) return str.toUpperCase();
        return null;
    }

    static truncate(str: string, size: number) {
        if (isString(str)) return str.slice(0, size);
        return null;
    }
}

import { DataTypeFieldConfig, FieldType } from '@terascope/types';
import {
    Vector, AnyVector, ListVector, StringVector
} from './types';

export * from './interfaces';
export * from './types';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function newVector<T>(config: DataTypeFieldConfig, values: any[]): Vector<T> {
    const type = config.type as FieldType;
    if (!(type in FieldType)) {
        throw new Error(`Unsupported field type ${type}`);
    }

    if (config.array) {
        return new ListVector<any>(
            type,
            values,
            (childValues) => _newVector<T>(
                type, childValues as any[]
            )
        ) as Vector<T>;
    }
    return _newVector<T>(type, values);
}

function _newVector<T>(type: FieldType, values: any[]): Vector<T> {
    switch (type) {
        case FieldType.Keyword:
        case FieldType.String:
            return new StringVector(type, values) as Vector<T>;
        default:
            return new AnyVector(type, values);
    }
}

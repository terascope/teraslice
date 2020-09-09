import { DataTypeFieldConfig, FieldType } from '@terascope/types';
import { ListVector } from './list-vector';
import { newVectorForType } from './utils';
import { Vector } from './vector';

export * from './types';
export * from './vector';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function newVector<T>(config: DataTypeFieldConfig, values: any[]): Vector<T> {
    const type = config.type as FieldType;
    if (!(type in FieldType)) {
        throw new Error(`Unsupported field type ${type}`);
    }

    if (config.array) {
        return new ListVector({
            type,
            values,
        }) as Vector<any>;
    }

    return newVectorForType(type, values) as Vector<T>;
}

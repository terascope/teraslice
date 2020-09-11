import { DataTypeFieldConfig, FieldType } from '@terascope/types';
import { ListVector } from './list-vector';
import { newVectorForType } from './utils';
import { Vector } from './vector';

export * from './types';
export * from './vector';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function newVector<T>(config: DataTypeFieldConfig, values: any[]): Vector<T> {
    const fieldType = config.type as FieldType;
    if (!(fieldType in FieldType)) {
        throw new Error(`Unsupported field type ${fieldType}`);
    }

    if (config.array) {
        return new ListVector({
            fieldType,
            values,
        }) as Vector<any>;
    }

    return newVectorForType(fieldType, values) as Vector<T>;
}

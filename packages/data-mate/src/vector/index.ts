import { DataTypeFieldConfig, FieldType } from '@terascope/types';
import { ListVector } from './list-vector';
import { _newVectorForType } from './utils';
import { Data, Vector } from './vector';

export * from './types';
export * from './vector';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function newVector<T>(config: DataTypeFieldConfig, data: Data<any>): Vector<T> {
    const fieldType = config.type as FieldType;
    if (!(fieldType in FieldType)) {
        throw new Error(`Unsupported field type ${fieldType}`);
    }

    if (config.array) {
        return new ListVector({
            fieldType,
            data,
        }) as Vector<any>;
    }

    return _newVectorForType(fieldType, data) as Vector<T>;
}

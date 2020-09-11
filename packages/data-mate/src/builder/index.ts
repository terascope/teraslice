import { DataTypeFieldConfig, FieldType } from '@terascope/types';
import { ListBuilder } from './list-builder';
import { newBuilderForType } from './utils';
import { Builder } from './builder';

export * from './types';
export * from './builder';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function newBuilder<T>(config: DataTypeFieldConfig): Builder<T> {
    const fieldType = config.type as FieldType;
    if (!(fieldType in FieldType)) {
        throw new Error(`Unsupported field type ${fieldType}`);
    }

    if (config.array) {
        return new ListBuilder({
            fieldType,
        }) as Builder<any>;
    }

    return newBuilderForType(fieldType) as Builder<T>;
}

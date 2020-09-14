import { DataTypeFieldConfig, DataTypeFields, FieldType } from '@terascope/types';
import { ListBuilder } from './list-builder';
import { _newBuilderForType } from './utils';
import { Builder } from './builder';

export * from './types';
export * from './builder';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function newBuilder<T>(
    config: DataTypeFieldConfig,
    childConfig?: DataTypeFields
): Builder<T> {
    const fieldType = config.type as FieldType;
    if (!(fieldType in FieldType)) {
        throw new Error(`Unsupported field type ${fieldType}`);
    }

    if (config.array) {
        return new ListBuilder({ config, childConfig }) as Builder<any>;
    }

    return _newBuilderForType(config, childConfig) as Builder<T>;
}
Builder.fromConfig = newBuilder;

import { DataTypeFields, FieldType } from '@terascope/types';
import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { ReadableData, WritableData } from '../../core';

const emptyData = new ReadableData<any>(WritableData.make(0));
/**
 * @todo improve the valueToJSON function
*/
export class ObjectVector<
    T extends Record<string, any> = Record<string, any>
> extends Vector<T> {
    constructor(options: VectorOptions<T>) {
        super(VectorType.Object, options);
        this.sortable = false;
    }

    fork(data: ReadableData<T>): ObjectVector<T> {
        return new ObjectVector({
            config: this.config,
            data,
            childConfig: this.childConfig,
        });
    }

    valueToJSON(value: T): any {
        if (!value || typeof value !== 'object') {
            throw new Error('Invalid input to ObjectVector.valueToJSON');
        }
        const val = value as Record<string, any>;
        if (this.childConfig == null) {
            return { ...val };
        }

        const fields = Object.keys(this.childConfig) as (keyof T)[];
        if (!fields.length) {
            return { ...val };
        }

        const input = value as Record<keyof T, unknown>;
        const result: Partial<T> = {};

        for (const field of fields) {
            if (input[field] != null) {
                const config = this.childConfig[field as string];
                const childConfig = (config.type === FieldType.Object
                    ? getChildConfig(this.childConfig, field as string)
                    : undefined);
                const vector = Vector.make<any>(
                    config, emptyData, childConfig
                );
                result[field] = (
                    vector.valueToJSON ? vector.valueToJSON(input[field]) : input[field]
                );
            } else {
                input[field] = null;
            }
        }

        return result;
    }
}

function getChildConfig(config: DataTypeFields, baseField: string): DataTypeFields {
    const childConfig: DataTypeFields = {};
    for (const [field, fieldConfig] of Object.entries(config)) {
        const withoutBase = field.replace(`${baseField}.`, '');
        if (withoutBase !== field) {
            childConfig[withoutBase] = fieldConfig;
        }
    }
    return childConfig;
}

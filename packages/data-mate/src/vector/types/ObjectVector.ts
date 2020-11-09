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
    static valueToJSON<R extends Record<string, any>>(
        value: R, thisArg: Vector<any>|undefined
    ): any {
        if (!value || typeof value !== 'object') {
            throw new Error('Invalid input to ObjectVector.valueToJSON');
        }
        if (!thisArg) {
            throw new Error('Expected thisArg in ObjectVector.valueToJSON');
        }
        const val = value as Record<string, any>;
        if (thisArg.childConfig == null) {
            return { ...val };
        }

        const fields = Object.keys(thisArg.childConfig) as (keyof R)[];
        if (!fields.length) {
            return { ...val };
        }

        const input = value as Record<keyof R, unknown>;
        const result: Partial<R> = {};

        for (const field of fields) {
            if (input[field] != null) {
                const config = thisArg.childConfig[field as string];
                const childConfig = (config.type === FieldType.Object
                    ? getChildConfig(thisArg.childConfig, field as string)
                    : undefined);
                const vector = Vector.make<any>(
                    config, emptyData, childConfig
                );
                result[field] = (
                    vector.valueToJSON ? vector.valueToJSON(input[field], vector) : input[field]
                );
            } else {
                input[field] = null;
            }
        }

        return result;
    }
    constructor(options: VectorOptions<T>) {
        super(VectorType.Object, {
            valueToJSON: ObjectVector.valueToJSON,
            ...options,
        });
        this.sortable = false;
    }

    fork(data: ReadableData<T>): ObjectVector<T> {
        return new ObjectVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
            childConfig: this.childConfig,
        });
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

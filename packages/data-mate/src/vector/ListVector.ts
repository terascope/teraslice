import { Maybe } from '@terascope/types';
import { isNotNil } from '@terascope/utils';
import { Vector, VectorOptions } from './Vector';
import { SerializeOptions, VectorType } from './interfaces';
import { ReadableData } from '../core';

export class ListVector<T = unknown> extends Vector<readonly Maybe<T>[]> {
    readonly convertValueToJSON: (options?: SerializeOptions) => (value: Maybe<T>) => any;
    #_valueVector?: Vector<T>;

    constructor(data: ReadableData<readonly Maybe<T>[]>, options: VectorOptions) {
        super(VectorType.List, data, options);
        this.sortable = false;
        this.convertValueToJSON = (opts?: SerializeOptions) => {
            const nilValue: any = opts?.useNullForUndefined ? null : undefined;
            return (value: Maybe<T>): any => {
                if (value == null || !this.valueVector.valueToJSON) {
                    return value ?? nilValue;
                }
                return this.valueVector.valueToJSON(value, opts);
            };
        };
    }

    get valueVector(): Vector<T> {
        if (this.#_valueVector) return this.#_valueVector;
        this.#_valueVector = Vector.make<T>(
            ReadableData.emptyData,
            {
                childConfig: this.childConfig,
                config: {
                    ...this.config,
                    array: false,
                },
                name: this.name,
            }
        );
        return this.#_valueVector;
    }

    valueToJSON(values: readonly Maybe<T>[], options?: SerializeOptions): any {
        const result = values.map(this.convertValueToJSON(options));
        if (!options?.skipNilValues) return result;
        return result.filter(isNotNil);
    }
}

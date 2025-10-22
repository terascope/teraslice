import { AnyObject, FieldType, Maybe } from '@terascope/types';
import { isNotNil, getHashCodeFrom } from '@terascope/core-utils';
import { Vector, VectorOptions } from './Vector.js';
import { DataBuckets, SerializeOptions, VectorType } from './interfaces.js';

export class ListVector<T = unknown> extends Vector<readonly Maybe<T>[]> {
    getComparableValue = undefined;

    readonly convertValueToJSON: (options?: SerializeOptions) => (value: Maybe<T>) => any;
    #_valueVector?: Vector<T>;

    constructor(data: DataBuckets<readonly Maybe<T>[]>, options: VectorOptions) {
        super(VectorType.List, data, options);
        this.sortable = false;
        this.convertValueToJSON = (opts?: SerializeOptions) => {
            const nilValue: any = opts?.useNullForUndefined ? null : undefined;
            return (value: Maybe<T>): any => {
                if (value == null || !this.valueVector.toJSONCompatibleValue) {
                    return value ?? nilValue;
                }
                return this.valueVector.toJSONCompatibleValue(value, opts);
            };
        };
    }

    get valueVector(): Vector<T> {
        if (this.#_valueVector) return this.#_valueVector;
        this.#_valueVector = Vector.make<T>(
            [],
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

    /**
     * Get list value by row index, returns an iterator that will serialize
     * each value at a time
    */
    * getRowIterator(
        index: number, json?: boolean, options?: SerializeOptions
    ): Iterable<Maybe<T>> {
        if (options?.skipDuplicateObjects) {
            throw new Error('ListVector->getIterator is incompatible with skipDuplicateObjects');
        }

        if (options?.skipEmptyArrays && this.isEmpty()) {
            return;
        }

        const found = this.findDataWithIndex(index);
        if (!found) return;

        const nilValue: any = options?.useNullForUndefined ? null : undefined;
        const vectorType = this.valueVector.config.type;
        const isObjectType = vectorType === FieldType.Object;
        const skipNilValues = (options?.skipNilListValues || (
            isObjectType && options?.skipNilObjectValues
        ));

        const val = found[0].get(found[1]);
        if (val == null) {
            if (skipNilValues) return;
            yield nilValue;
            return;
        }

        const fn = this.convertValueToJSON(options);
        for (const item of val) {
            const result = json ? fn(item) : item;
            if (result == null) {
                if (!skipNilValues) {
                    yield nilValue;
                }
            } else {
                yield result;
            }
        }
    }

    toJSONCompatibleValue(values: readonly Maybe<T>[], options?: SerializeOptions): any {
        let result = values.map(this.convertValueToJSON(options));
        const vectorType = this.valueVector.config.type;
        const isObjectType = vectorType === FieldType.Object;
        // ordering doesn't matter here but I think
        // might be a tad bit better to remove the
        // the nil values
        if (options?.skipNilListValues || (
            isObjectType && options?.skipNilObjectValues
        )) {
            result = result.filter(isNotNil);
        }

        if (options?.skipDuplicateObjects && isObjectType) {
            result = dedupeValues(result);
        }
        if (options?.skipEmptyArrays && !result.length) {
            return options?.useNullForUndefined ? null : undefined;
        }
        return result;
    }
}

function dedupeValues(result: Maybe<AnyObject>[]): Maybe<AnyObject>[] {
    const hashes = new Set<string>();
    return result.filter((value) => {
        const hash = getHashCodeFrom(value);
        if (hashes.has(hash)) return false;

        hashes.add(hash);
        return true;
    });
}

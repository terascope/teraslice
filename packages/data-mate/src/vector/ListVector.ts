import { AnyObject, FieldType, Maybe } from '@terascope/types';
import { isNotNil, getHashCodeFrom } from '@terascope/utils';
import { Vector, VectorOptions } from './Vector';
import { DataBuckets, SerializeOptions, VectorType } from './interfaces';

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

    toJSONCompatibleValue(values: readonly Maybe<T>[], options?: SerializeOptions): any {
        let result = values.map(this.convertValueToJSON(options));
        const vectorType = this.valueVector.config.type;
        const isObjectType = vectorType === FieldType.Object;
        // ordering doesn't mater here but I think
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

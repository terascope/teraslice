import { FieldType } from '@terascope/types';
import { isNotNil } from '@terascope/core-utils';
import { Vector, VectorOptions } from '../Vector.js';
import { SerializeOptions, VectorType, DataBuckets } from '../interfaces.js';
import { getChildDataTypeConfig } from '../../core/index.js';

type ChildFields<T extends Record<string, any>> = readonly (
    [field: (keyof T), vector: Vector<any>]
)[];

export class ObjectVector<
    T extends Record<string, any> = Record<string, any>
> extends Vector<T> {
    getComparableValue = undefined;

    #childFields?: ChildFields<T>;

    constructor(data: DataBuckets<T>, options: VectorOptions) {
        super(VectorType.Object, data, options);
        this.sortable = false;
    }

    get childFields(): ChildFields<T> {
        if (this.#childFields) return this.#childFields;

        if (!this.childConfig) {
            this.#childFields = [];
            return this.#childFields;
        }
        const childFields: ChildFields<T> = Object.entries(this.childConfig)
            .map(([field, config]): [string, Vector<any>] | undefined => {
                const [base] = field.split('.', 1);
                if (base !== field && this.childConfig![base]) return;

                const vector = Vector.make<any>([], {
                    childConfig: getChildDataTypeConfig(
                        this.childConfig!, field, config.type as FieldType
                    ),
                    config,
                    name: this._getChildName(field)
                });
                return [field, vector];
            })
            .filter(isNotNil) as ChildFields<T>;

        this.#childFields = childFields;
        return childFields;
    }

    toJSONCompatibleValue(value: T, options?: SerializeOptions): any {
        const val = value as Record<string, any>;
        const nilValue: any = options?.useNullForUndefined ? null : undefined;

        if (!this.childFields.length) {
            if (options?.skipEmptyObjects && !Object.keys(val).length) {
                return nilValue;
            }
            return { ...val };
        }

        const input = value as Readonly<Record<keyof T, unknown>>;
        const result: Partial<T> = {};
        let numKeys = 0;
        const { skipNilValues, skipEmptyObjects } = options ?? {};

        for (const [field, vector] of this.childFields) {
            if (input[field] != null) {
                const fieldValue = (
                    vector.toJSONCompatibleValue
                        ? vector.toJSONCompatibleValue(
                            input[field], options
                        )
                        : input[field]
                );
                if (fieldValue == null) {
                    if (!skipNilValues && nilValue === null) {
                        result[field] = nilValue;
                    }
                } else {
                    numKeys++;
                    result[field] = fieldValue;
                }
            // set value to nilValue if it exists in the
            // child config but not the input object
            } else if (!skipNilValues && nilValue === null) {
                result[field] = nilValue;
            }
        }

        if (skipEmptyObjects && !numKeys) return nilValue;
        return result;
    }

    private _getChildName(field: string): string | undefined {
        if (!this.name) return undefined;
        return `${this.name}.${field}`;
    }
}

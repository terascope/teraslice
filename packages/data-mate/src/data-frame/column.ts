import { DataTypeFieldConfig, Maybe } from '@terascope/types';

export class Column<T = unknown> {
    protected readonly _values: Maybe<T>[]

    constructor(
        readonly name: string,
        readonly config: DataTypeFieldConfig,
        values: Maybe<T>[]
    ) {
        this._values = values.slice();
    }

    * [Symbol.iterator](): IterableIterator<Maybe<T>> {
        for (const val of this._values) {
            yield val;
        }
    }

    get length(): number {
        return this._values.length;
    }

    toArray(): Maybe<T>[] {
        return this._values.slice();
    }
}

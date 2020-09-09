import { DataTypeFieldConfig, Maybe } from '@terascope/types';
import { newVector, Vector } from './vector';

export class Column<T = unknown> {
    protected readonly _vector: Vector<T>;

    constructor(
        readonly name: string,
        readonly config: DataTypeFieldConfig,
        values: Maybe<T>[]
    ) {
        this._vector = newVector(config, values);
    }

    * [Symbol.iterator](): IterableIterator<Maybe<T>> {
        yield* this._vector;
    }

    get length(): number {
        return this._vector.length;
    }

    toArray(): Maybe<T>[] {
        return this._vector.toArray();
    }

    get vector(): Vector<T> {
        return this._vector;
    }
}

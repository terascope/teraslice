import { MultiMap } from 'mnemonist';
import { Column } from './column';

/**
 * Grouped Data with aggregation support
*/
export class GroupedData<T extends Record<string, any>> {
    data = new MultiMap<string, T>();

    constructor(
        readonly columns: readonly Column<any>[],
        readonly keys: (keyof T)[]
    ) {}

    avg(_field: keyof T): void {

    }

    sum(_field: keyof T): void {

    }

    min(_field: keyof T): void {

    }

    max(_field: keyof T): void {

    }

    count(_field: keyof T): void {

    }

    unique(_field: keyof T): void {

    }

    /**
     * Run aggregations and flatten the grouped data into a DataFrame
    */
    collect(): Column[] {
        return this.columns.slice(); // FIXME
    }
}

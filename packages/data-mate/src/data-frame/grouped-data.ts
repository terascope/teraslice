import { Column } from '../column';
import { AggregationFn } from './interfaces';

type FieldAgg = [fn: AggregationFn, when?: string];
/**
 * Grouped Data with aggregation support
*/
export class GroupedData<T extends Record<string, any>> {
    protected _aggregations: Partial<Record<keyof T, FieldAgg[]>> = {};

    constructor(
        readonly columns: readonly Column<any>[],
        readonly keys: (keyof T)[]
    ) {}

    avg(field: keyof T, when?: string): GroupedData<T> {
        this._addAgg(field, [AggregationFn.AVG, when]);
        return this;
    }

    sum(field: keyof T, when?: string): GroupedData<T> {
        this._addAgg(field, [AggregationFn.SUM, when]);
        return this;
    }

    min(field: keyof T, when?: string): GroupedData<T> {
        this._addAgg(field, [AggregationFn.MIN, when]);
        return this;
    }

    max(field: keyof T, when?: string): GroupedData<T> {
        this._addAgg(field, [AggregationFn.MAX, when]);
        return this;
    }

    count(field: keyof T, when?: string): GroupedData<T> {
        this._addAgg(field, [AggregationFn.COUNT, when]);
        return this;
    }

    unique(field: keyof T, when?: string): GroupedData<T> {
        this._addAgg(field, [AggregationFn.UNIQUE, when]);
        return this;
    }

    hourly(field: keyof T, when?: string): GroupedData<T> {
        this._addAgg(field, [AggregationFn.HOURLY, when]);
        return this;
    }

    daily(field: keyof T, when?: string): GroupedData<T> {
        this._addAgg(field, [AggregationFn.DAILY, when]);
        return this;
    }

    monthly(field: keyof T, when?: string): GroupedData<T> {
        this._addAgg(field, [AggregationFn.MONTHLY, when]);
        return this;
    }

    yearly(field: keyof T, when?: string): GroupedData<T> {
        this._addAgg(field, [AggregationFn.YEARLY, when]);
        return this;
    }

    protected _addAgg(field: keyof T, agg: FieldAgg): void {
        const aggs = (this._aggregations[field] ?? []) as FieldAgg[];
        this._aggregations[field] = aggs.concat([agg]);
    }

    /**
     * Run aggregations and flatten the grouped data into a DataFrame
    */
    collect(): Column[] {
        return this.columns.slice(); // FIXME
    }
}

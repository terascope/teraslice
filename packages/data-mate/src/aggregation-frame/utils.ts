import { FieldType } from '@terascope/types';
import { Builder } from '../builder';
import { Column, ValueAggregation, KeyAggregation } from '../column';
import { WritableData } from '../core';
import {
    isNumberLike, isFloatLike
} from '../vector';

export function getBuilderForField(
    col: Column<any, any>,
    length: number,
    keyAgg?: KeyAggregation,
    valueAgg?: ValueAggregation
): Builder<any> {
    const data = WritableData.make(length);
    if (!keyAgg && !valueAgg) {
        return Builder.make(
            col.config, data, col.vector.childConfig
        );
    }

    if (keyAgg && !valueAgg) {
        return Builder.make<any>(
            col.config,
            data,
            col.vector.childConfig
        );
    }

    const currentType = col.config.type as FieldType;
    let type: FieldType|undefined;
    if (valueAgg === ValueAggregation.avg) {
        if (currentType === FieldType.Long) {
            type = FieldType.Double;
        } else if (isNumberLike(currentType)) {
            type = FieldType.Float;
        }
    } else if (valueAgg === ValueAggregation.sum) {
        if (currentType === FieldType.Long || currentType === FieldType.Integer) {
            type = FieldType.Long;
        } else if (currentType === FieldType.Short || currentType === FieldType.Byte) {
            type = FieldType.Integer;
        } else if (isFloatLike(currentType)) {
            type = FieldType.Float;
        }
    } else if (valueAgg === ValueAggregation.max || valueAgg === ValueAggregation.min) {
        if (isNumberLike(currentType)) {
            type = currentType;
        }
    } else if (valueAgg === ValueAggregation.count) {
        type = FieldType.Integer;
    }

    if (!type) {
        throw new Error(`Unsupported field type ${currentType} for aggregation ${valueAgg}`);
    }

    return Builder.make<any>({
        type,
        array: false,
        description: col.config.description // FIXME append agg info
    }, data);
}

export function getMaxColumnSize(
    columns: readonly Column<any, any>[]
): number {
    return Math.max(
        ...columns.map((col) => col.vector.size)
    );
}

import { FieldType } from '@terascope/types';
import { Builder } from '../builder';
import { Column, ValueAggregation, KeyAggregation } from '../column';
import { WritableData } from '../core';
import {
    isNumberLike, isFloatLike, getCommonTupleType
} from '../vector';

export function getBuilderForField(
    col: Column<any, any>,
    length: number,
    keyAgg?: KeyAggregation,
    valueAgg?: ValueAggregation
): Builder<any> {
    const data = new WritableData(length);
    if (!keyAgg && !valueAgg) {
        return Builder.make(data, {
            childConfig: col.vector.childConfig,
            config: col.vector.config,
            name: col.name,
        });
    }

    if (keyAgg && !valueAgg) {
        return Builder.make<any>(data, {
            childConfig: col.vector.childConfig,
            config: col.vector.config,
            name: col.name,
        });
    }

    let currentType = col.config.type as FieldType;
    if (currentType === FieldType.Tuple) {
        currentType = getCommonTupleType(
            col.name, col.vector.childConfig
        );
    }
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
        if (currentType === FieldType.IP) {
            type = FieldType.Integer;
        }
    } else if (valueAgg === ValueAggregation.count) {
        type = FieldType.Integer;
        if (currentType === FieldType.IP) {
            type = FieldType.Integer;
        }
    }

    if (!type) {
        throw new Error(`Unsupported field type ${currentType} for aggregation ${valueAgg}`);
    }

    return Builder.make<any>(data, {
        childConfig: undefined,
        config: {
            type,
            array: false,
            description: col.config.description // FIXME append agg info
        },
        name: col.name,
    });
}

export function getMaxColumnSize(
    columns: readonly Column<any, any>[]
): number {
    return Math.max(
        ...columns.map((col) => col.vector.size)
    );
}

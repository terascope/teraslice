import { get } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import { Column } from '../column';
import { Builder } from '../builder';
import {
    ValueAggregation, KeyAggregation, isNumberLike, isFloatLike
} from '../vector';

export function getBuilderForField(
    col: Column<any>,
    keyAgg?: KeyAggregation,
    valueAgg?: ValueAggregation
): Builder<any> {
    if (!keyAgg && !valueAgg) {
        return Builder.make(
            col.config, get(col.vector, 'childConfig')
        );
    }

    if (keyAgg && !valueAgg) {
        return Builder.make<any>(
            col.config,
            get(col.vector, 'childConfig')
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
        if (type === FieldType.Long || type === FieldType.Integer) {
            type = FieldType.Long;
        } else if (type === FieldType.Short || type === FieldType.Byte) {
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
        throw new Error(`Unsupported field type ${type} for aggregation ${valueAgg}`);
    }

    return Builder.make<any>({
        type,
        array: false,
        description: col.config.description // FIXME append agg info
    });
}

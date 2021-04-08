import { parseGeoPoint, isNil, isNumber } from '@terascope/utils';
import { FieldType, DataTypeFieldConfig } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren
} from '../interfaces';

/**
 * Converts the value into a geo-point
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @example
 *
 * fieldTransform.toGeoPoint('60, 40'); // { lon: 40, lat: 60 };
 * fieldTransform.toGeoPoint([40, 60]); // { lon: 40, lat: 60 };
 * fieldTransform.toGeoPoint({ lat: 40, lon: 60 }); // { lon: 60, lat: 40 };
 * fieldTransform.toGeoPoint({ latitude: 40, longitude: 60 }); // { lon: 60, lat: 40 }
 *
 * const results = FieldTransform.toGeoPoint(['60, 40', null, [50, 60]]);
 * results === [{ lon: 40, lat: 60 },{ lon: 50, lat: 60 }];
 *
 * @param {*} input
 * @returns {{ lat: number, lon: number } | { lat: number, lon: number }[] | null }
 * returns null if input is null/undefined
 */

export const toGeoPointConfig: FieldTransformConfig = {
    name: 'toGeoPoint',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.FULL_VALUES,
    description: 'Converts a truthy or falsy value to boolean',
    create() {
        return (input: unknown) => {
            if (isNil(input)) return null;

            if (Array.isArray(input) && !_isNumberTuple(input)) {
                return input
                    .map((data: any) => {
                        if (isNil(data)) return null;
                        return parseGeoPoint(data, true);
                    });
            }

            return parseGeoPoint(input as any, true);
        };
    },
    accepts: [
        FieldType.String,
        FieldType.Object,
        FieldType.GeoPoint,
        FieldType.Number,
        FieldType.Float
    ],
    // TODO: fix this
    output_type(inputConfig: DataTypeFieldAndChildren): DataTypeFieldAndChildren {
        const { field_config } = inputConfig;
        const array = arrayType(field_config);

        return {
            field_config: {
                ...field_config,
                type: FieldType.GeoPoint,
                array
            },
        };
    }
};

function arrayType(fieldConfig: DataTypeFieldConfig): boolean {
    if (fieldConfig.type === FieldType.Number || fieldConfig.type === FieldType.Float) {
        return false;
    }

    return fieldConfig.array ?? false;
}

function _isNumberTuple(input: unknown, _parentContext?: unknown): boolean {
    if (Array.isArray(input) && input.length === 2) {
        return input.every(isNumber);
    }

    return false;
}

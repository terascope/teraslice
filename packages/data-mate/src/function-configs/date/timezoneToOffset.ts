import { FieldType } from '@terascope/types';
import { timezoneToOffset } from '@terascope/utils';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces';

export const timezoneToOffsetConfig: FieldTransformConfig = {
    name: 'timezoneToOffset',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: `Given a timezone, it will return the offset from UTC in minutes.
     This uses current server time as the reference for a date, so results may vary
     depending on daylight savings time adjustments`,
    create() {
        return timezoneToOffset;
    },
    accepts: [
        FieldType.String,
    ],
    output_type(inputConfig) {
        const { field_config } = inputConfig;

        return {
            field_config: {
                ...field_config,
                type: FieldType.Number
            },
        };
    }
};

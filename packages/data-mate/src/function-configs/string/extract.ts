import { match } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren,
    FunctionDefinitionCategory
} from '../interfaces';

export interface ExtractArgs {
    regex?: string;
    start?: string;
    end?: string;
}

export const extractConfig: FieldTransformConfig<ExtractArgs> = {
    name: 'extract',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Extract values from strings',
    create(args) {
        return _extract(args);
    },
    accepts: [FieldType.String],
    // TODO: fix this
    output_type(inputConfig: DataTypeFieldAndChildren): DataTypeFieldAndChildren {
        const { field_config } = inputConfig;

        return {
            field_config: {
                ...field_config,
                type: FieldType.String
            },
        };
    },
    argument_schema: {

    },
    validate_arguments() {}
};

function _extract(args: ExtractArgs) {
    if (args.regex) return extractByRegex(args.regex);
    if (args.start && args.end) return extractMarkers(args.start, args.end);
    throw new Error('Invalid config for extract, must provide either "regex" or "start" and "end"')
}

function extractByRegex(regex: RegExp|string) {
    return (input: string) => match(regex, input);
}

function extractMarkers(start: string, end: string) {

}

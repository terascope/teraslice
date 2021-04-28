import { isMacAddress, isString, joinList } from '@terascope/utils';
import { MACDelimiter, FieldType } from '@terascope/types';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory
} from '../interfaces';

export interface IsMacArgs {
    delimiter?: string | string[];
}

const delimiterOptions = ['space', 'colon', 'dash', 'dot', 'none', 'any'];

export const isMACAddressConfig: FieldValidateConfig<IsMacArgs> = {
    name: 'isMACAddress',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Checks to see if input is a valid mac address',
    create({ delimiter }: IsMacArgs) {
        return (input: unknown) => isString(input)
            && isMacAddress(input, delimiter as MACDelimiter);
    },
    accepts: [FieldType.String],
    argument_schema: {
        delimiter: {
            type: FieldType.Any,
            description: 'Specify delimiter character for mac address format'
        }
    },
    required_arguments: [],
    validate_arguments({ delimiter }) {
        let delimiterValues: string[];

        if (!delimiter) return;

        if (delimiter && !Array.isArray(delimiter)) delimiterValues = [delimiter];
        else delimiterValues = delimiter as string[];

        delimiterValues.forEach((value) => {
            if (!delimiterOptions.includes(value)) {
                throw new Error(`Invalid mac address delimiter, must be a list of or one of ${joinList(delimiterOptions)}`);
            }
        });
    }
};

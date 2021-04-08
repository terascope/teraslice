import { isMacAddress, isString, joinList } from '@terascope/utils';
import { MACDelimiter, FieldType } from '@terascope/types';
import { FieldValidateConfig, ProcessMode, FunctionDefinitionType } from '../interfaces';

/**
 * Checks if value is a valid MacAddress, option to pass in delimiter or a list of delimiters
 *
 * @example
 * isMACAddress('00:1f:f3:5b:2b:1f'); // true
 * isMACAddress('001ff35b2b1f'); // true
 * isMACAddress('00-1f-f3-5b-2b-1f'); // true
 * isMACAddress('001f.f35b.2b1f', { delimiter: 'dot' }); // true
 * isMACAddress('00-1f-f3-5b-2b-1f', { delimiter: ['dash', 'colon']} ); // true
 *
 * isMACAddress('004231f3f325b12211'} ); // false
 * isMACAddress(12345); // false
 * isMACAddress('00-1f-f3-5b-2b-1f', { delimiter: ['dot', 'colon']} ); // false
 *
 * @param {*} input
 * @param {{delimiter}} [{ delimiter?: string}] may be set to 'colon'|'space'|'dash'|'dot'|'none'
 * @returns {boolean} boolean
 */

 export interface IsMacArgs {
    delimiter?: string | string[];
}

const delimiterOptions = ['space', 'colon', 'dash', 'dot', 'none', 'any'];

export const isMACAddress: FieldValidateConfig<IsMacArgs> = {
    name: 'isMacAddress',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
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

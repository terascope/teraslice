import { toString } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren
} from '../interfaces';

export const decodeBase64Config: FieldTransformConfig = {
    name: 'decodeBase64',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Converts a base64 hash back to its value',
    create() {
        // @ts-expect-error
        return (input: unknown) => parsePhoneNumber(input as string);
    },
    accepts: [FieldType.String, FieldType.Number],
    output_type(inputConfig: DataTypeFieldAndChildren): DataTypeFieldAndChildren {
        const { field_config } = inputConfig;

        return {
            field_config: {
                ...field_config,
                type: FieldType.String
            },
        };
    }
};

// import PhoneValidator from 'awesome-phonenumber';


// function parsePhoneNumber(str: any) {
//     let testNumber = toString(str).trim();
//     if (testNumber.charAt(0) === '0') testNumber = testNumber.slice(1);

//     // needs to start with a +
//     if (testNumber.charAt(0) !== '+') testNumber = `+${testNumber}`;

//     const fullNumber = new PhoneValidator(testNumber).getNumber();
//     if (fullNumber) return String(fullNumber).slice(1);

//     throw Error('Could not determine the incoming phone number');
// }

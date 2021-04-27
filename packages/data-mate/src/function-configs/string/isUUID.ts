import { isUUID } from '@terascope/utils';
import { FieldValidateConfig, ProcessMode, FunctionDefinitionType } from '../interfaces';

/**
 * Validates that the input is a UUID
 *
 * @example
 *
 *   isUUID('95ecc380-afe9-11e4-9b6c-751b66dd541e') // true
 *   isUUID('0668CF8B-27F8-2F4D-4F2D-763AC7C8F68B') // true
 *   isUUID('123e4567-e89b-82d3-f456-426655440000') // true
 *   isUUID('')) // false
 *   isUUID('95ecc380:afe9:11e4:9b6c:751b66dd541e')) // false
 *   isUUID('123e4567-e89b-x2d3-0456-426655440000')) // false
 *   isUUID('123e4567-e89b-12d3-a456-42600')) // false
 *   isUUID(undefined)) // false
 *   isUUID('randomstring')) // false
 *   isUUID(true)) // false
 *   isUUID({})) // false
 *
 * @param {*} input
 * @returns {boolean} boolean
 *
 */

export const isUUIDConfig: FieldValidateConfig = {
    name: 'isUUID',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Checks to see if input is a UUID',
    create() { return isUUID; },
    accepts: [],
};

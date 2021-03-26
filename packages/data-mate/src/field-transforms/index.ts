import { FunctionConfigRepository } from '../interfaces';
import { toUpperCaseConfig } from './toUpperCase';

export const fieldTransformsRepository: FunctionConfigRepository = {
    toUpperCase: toUpperCaseConfig
};

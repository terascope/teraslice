import 'jest-extended';
import {
    functionConfigRepository,
    FunctionDefinitionConfig,
} from '../../src';
import { functionTestHarness } from './functionTestHarness';

Object.entries(functionConfigRepository).forEach(([key, fnDef]) => {
    functionTestHarness(fnDef as FunctionDefinitionConfig<any>, key);
});

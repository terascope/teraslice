import 'jest-extended';
import {
    functionConfigRepository
} from '../../../src';
import { functionTestHarness } from '../functionTestHarness';

functionTestHarness(functionConfigRepository.contains, [
]);

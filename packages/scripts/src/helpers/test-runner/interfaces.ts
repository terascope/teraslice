import { TestSuite } from '../interfaces';

export type TestOptions = {
    bail?: boolean;
    debug?: boolean;
    filter?: string;
    all?: boolean;
    suite?: TestSuite;
};

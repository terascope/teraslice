import { SchemaConstructor } from '@terascope/job-components';
import { OpTestHarnessOptions, AnyOperationConstructor } from './interfaces';

/**
 * A Teraslice Test Harness for testing the Operations
 * ran on the Worker and an associated lifecycle events.
 *
 * @todo Add support for attaching APIs and Observers
 * @todo Add support for slice retries
*/
export default class OpTestHarness {
    // @ts-ignore
    constructor(op: AnyOperationConstructor, schema: SchemaConstructor, options: OpTestHarnessOptions) {
    }

    // TODO
    get operation() {
        return null;
    }

    /**
     * Initialize the Operations on the ExecutionContext
    */
    async initialize() {
    }

    async run(input: any): Promise<any> {
        return input;
    }

    /**
     * Shutdown the Operations on the ExecutionContext
    */
    async shutdown() {
    }
}

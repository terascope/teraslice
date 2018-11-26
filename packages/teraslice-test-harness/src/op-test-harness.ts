import OpHarness from '@terascope/teraslice-op-test-harness';
import { TestClientConfig, CoreOperation } from '@terascope/job-components';
import { OpTestHarnessOptions } from './interfaces';

/**
 * A simple test harness for running an single operation
 * with minimal changes
*/
export default class OpTestHarness {
    harness: OpHarness.TestHarness;
    opTester: OpHarness.OperationTester|undefined;

    // @ts-ignore
    constructor(op: OpHarness.OpTestHarnessInput, options?: OpTestHarnessOptions) {
        this.harness = OpHarness(op);
        if (options) {
            this.harness.setClients(options.clients);
        }
    }

    /**
     * Set the Terafoundation Clients on both
     * the Slicer and Worker contexts
    */
    setClients(clients: TestClientConfig[]) {
        this.harness.setClients(clients);
    }

    /**
     * Get the Operation from the op test harness
    */
    get operation(): CoreOperation|null {
        if (this.opTester == null) return null;
        return this.opTester.operation;
    }

    /**
     * Initialize the Operations on the ExecutionContext
    */
    async initialize(options?: OpHarness.InitOptions) {
        const initOptions: OpHarness.InitOptions = options != null ? options : {
            opConfig: {
                _op: 'test'
            },
            type: 'reader'
        };
        this.opTester = await this.harness.init(initOptions);
    }

    async run(input: OpHarness.RunInput): Promise<OpHarness.RunResult> {
        if (this.opTester == null) {
            throw new Error('Initialize must be called before run');
        }

        return this.opTester.run(input);
    }

    /**
     * Shutdown the Operations on the ExecutionContext
    */
    async shutdown() {
        if (this.opTester != null) {
            await this.opTester.operation.shutdown();
        }

        this.harness.events.removeAllListeners();
    }
}

import { DataEntity } from '@terascope/core-utils';
import { OpConfig } from '../interfaces/index.js';
import ProcessorCore from './core/processor-core.js';

/**
 * A variation of "Processor" that deals with a batch of data at a time.
 */
export default abstract class BatchProcessor<T = OpConfig> extends ProcessorCore<T> {
    /**
     * A method called by {@link BatchProcessor#handle}
     * @returns an array of DataEntities
     */
    abstract onBatch(batch: DataEntity[]): Promise<DataEntity[]>;

    async handle(input: DataEntity[]): Promise<DataEntity[]> {
        const output = await this.onBatch(DataEntity.makeArray(input));

        // TODO: REVERT ME -- deliberate breakage, do not merge.
        //
        // Exists only to prove that e2e-assets-from-source-tests reports a real gap A
        // finding, per docs/development/asset-compatibility-testing.md. Every asset
        // processor routes through here, and an asset bundles its own copy of this
        // file, so a source-built asset picks this up while a released one keeps the
        // published behavior. That is the whole shape of gap A in one line.
        //
        // Deliberately invisible everywhere the finding should not appear:
        //  - behavioral rather than type-level, so `yarn api:check` sees nothing, which
        //    is the miss option 1 is documented as having;
        //  - gated on NODE_ENV, which the teraslice image sets to production and jest
        //    sets to test, so no unit suite here changes behavior (collect-spec drives
        //    50- and 100-record batches straight through handle);
        //  - core builtins are the only in-repo processors affected, and no e2e job
        //    fixture uses one -- the noop and delay steps both resolve to standard-assets
        //    -- so e2e-tests, which loads released bundles, stays green.
        if (process.env.NODE_ENV === 'production' && output.length > 0) output.pop();

        return DataEntity.makeArray(output);
    }
}

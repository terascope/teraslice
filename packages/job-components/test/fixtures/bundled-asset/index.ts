import { AssetExampleAPI, AssetSchemaAPI } from './new-asset-api';
import { AssetProcessorExampleBatch, AssetProcessorSchema } from './new-asset-processor';
import { AssetExampleFetcher, AssetReaderSchema, AssetExampleSlicer } from './new-asset-reader';

export default {
    /** A list of the operations provided by this asset bundle */
    ASSETS: {
        /** The key here would be the current file name */
        v3_processor: {
            Processor: AssetProcessorExampleBatch,
            Schema: AssetProcessorSchema,
        },
        v3_reader: {
            Fetcher: AssetExampleFetcher,
            Slicer: AssetExampleSlicer,
            Schema: AssetReaderSchema,
        },
        v3_api: {
            API: AssetExampleAPI,
            Schema: AssetSchemaAPI,
        },
    },
};

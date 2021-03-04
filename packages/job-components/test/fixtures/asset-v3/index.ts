import { AssetExampleAPI, AssetSchemaAPI } from './new-asset-api';
import { AssetProcessorExampleBatch, AssetProcessorSchema } from './new-asset-processor';
import { AssetExampleFetcher, AssetReaderSchema, AssetExampleSlicer } from './new-asset-reader';

export default {
    /** A list of the operations provided by this asset bundle */
    ASSETS: {
        /** The key here would be the current file name */
        my_processor: {
            Processor: AssetProcessorExampleBatch,
            Schema: AssetProcessorSchema,
        },
        my_reader: {
            Fetcher: AssetExampleFetcher,
            Slicer: AssetExampleSlicer,
            Schema: AssetReaderSchema,
        },
        my_api: {
            API: AssetExampleAPI,
            Schema: AssetSchemaAPI,
        },
    },
};

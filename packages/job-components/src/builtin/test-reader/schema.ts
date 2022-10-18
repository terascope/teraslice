import { TestReaderConfig } from './interfaces.js';
import { ConvictSchema } from '../../operations/index.js';

export default class Schema extends ConvictSchema<TestReaderConfig> {
    build(): Record<string, any> {
        return {
            fetcher_data_file_path: {
                default: null,
                doc: 'File to path to JSON array of data records. Defaults to ./data/fetcher-data.json this directroy',
                format: 'optional_String'
            },
            slicer_data_file_path: {
                default: null,
                doc: 'File to path to JSON array of slice requests. Defaults to ./data/slicer-data.json this directroy',
                format: 'optional_String'
            },
            passthrough_slice: {
                default: false,
                doc: 'If set to true then the fetcher will return what it is given, expects the value to be an array'
            }
        };
    }
}

import { OpConfig } from '../../interfaces/index.js';

export interface TestReaderConfig extends OpConfig {
    fetcher_data_file_path?: string;
    slicer_data_file_path?: string;
    passthrough_slice?: boolean;
}

import { OpConfig } from '../../interfaces';

export interface TestReaderConfig extends OpConfig {
    fetcher_data_file_path?: string;
    slicer_data_file_path?: string;
}

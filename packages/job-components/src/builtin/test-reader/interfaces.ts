import { OpConfig } from '../../interfaces';

export interface TestReaderConfig extends OpConfig {
    fetcherDataFilePath?: string;
    slicerDataFilePath?: string;
}

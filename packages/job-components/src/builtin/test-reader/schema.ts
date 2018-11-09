import { TestReaderConfig } from './interfaces';
import { ConvictSchema } from '../../operations';

export default class Schema extends ConvictSchema<TestReaderConfig> {
    build() {
        return {
            count: {
                default: 100,
                doc: 'Number of fake records to create',
                format: 'Number'
            }
        };
    }
}

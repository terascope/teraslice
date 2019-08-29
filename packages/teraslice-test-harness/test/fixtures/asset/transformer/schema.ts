import { ConvictSchema } from '@terascope/job-components';
import { TransformerConfig, actions } from './interfaces';

export default class Schema extends ConvictSchema<TransformerConfig> {
    build() {
        return {
            action: {
                default: null,
                doc: 'The type of tranformation action to perform. (Required)',
                format: actions
            },
            key: {
                default: null,
                doc: 'The key to transform on the data. (Required)',
                format: 'String'
            },
            setValue: {
                default: '',
                doc: 'The value to set when using action "set"',
                format: 'String'
            },
            incBy: {
                default: 1,
                doc: 'The count to increment by when using the action "inc"',
                format: 'Number'
            },
        };
    }
}

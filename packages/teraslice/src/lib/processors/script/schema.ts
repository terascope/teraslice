import { ConvictSchema } from '@terascope/job-components';
import { ScriptConfig } from './interfaces.js';

export default class Schema extends ConvictSchema<ScriptConfig> {
    build() {
        return {
            command: {
                doc: 'what command to run',
                default: 'echo',
                format: 'required_String'
            },
            args: {
                doc: 'arguments to pass along with the command',
                default: [],
                format(val: unknown) {
                    if (!Array.isArray(val)) {
                        throw new Error('args for script must be an array');
                    }
                }
            },
            options: {
                doc: 'Obj containing options to pass into the process env',
                default: {}
            },
            asset: {
                doc: 'name of asset to use for op',
                default: 'echo',
                format: 'optional_String'
            }
        };
    }
}

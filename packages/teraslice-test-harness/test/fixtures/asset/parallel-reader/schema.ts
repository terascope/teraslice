import { ConvictSchema } from '@terascope/job-components';

export default class Schema extends ConvictSchema<Record<string, any>> {
    build(): Record<string, any> {
        return {};
    }
}

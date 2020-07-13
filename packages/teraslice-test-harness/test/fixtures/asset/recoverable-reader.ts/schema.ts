import { ConvictSchema, AnyObject } from '@terascope/job-components';

export default class Schema extends ConvictSchema<AnyObject> {
    build(): AnyObject {
        return {};
    }
}

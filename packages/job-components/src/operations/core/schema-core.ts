import { Context } from '@terascope/teraslice-types';

/**
 * A base class for supporting "Schema" definition
 */

export default abstract class SchemaCore {
    abstract build(context?: Context): any;
}

import convict from 'convict';
import { Context } from '@terascope/teraslice-types';
import SchemaCore from './core/schema-core';

/**
 * A base class for supporting convict "Schema" definitions
 */

export default abstract class ConvictSchema extends SchemaCore {
    static type() {
        return 'convict';
    }

    abstract build(context?: Context): convict.Schema<any>;
}

import * as es from 'elasticsearch';
import { IndexModel, IndexModelOptions } from 'elasticsearch-store';
import dataTypesConfig, { DataType, GraphQLSchema } from './config/data-types';

/**
 * Manager for DataTypes
*/
export class DataTypes extends IndexModel<DataType> {
    static IndexModelConfig = dataTypesConfig;
    static GraphQLSchema = GraphQLSchema;

    constructor(client: es.Client, options: IndexModelOptions) {
        super(client, options, dataTypesConfig);
    }
}

export { DataType };

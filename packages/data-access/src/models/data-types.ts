import * as es from 'elasticsearch';
import { IndexModel, IndexModelOptions } from 'elasticsearch-store';
import dataTypesConfig, { DataTypeModel, GraphQLSchema } from './config/data-types';

/**
 * Manager for DataTypes
*/
export class DataTypes extends IndexModel<DataTypeModel> {
    static ModelConfig = dataTypesConfig;
    static GraphQLSchema = GraphQLSchema;

    constructor(client: es.Client, options: IndexModelOptions) {
        super(client, options, dataTypesConfig);
    }
}

export { DataTypeModel };

import * as es from 'elasticsearch';
import { TypeConfig } from 'xlucene-evaluator';
import { Base, BaseModel, CreateModel, UpdateModel } from './base';
import dataTypesConfig from './config/data-types';
import { ManagerConfig } from '../interfaces';

/**
 * Manager for DataTypes
*/
export class DataTypes extends Base<DataTypeModel, CreateDataTypeInput, UpdateDataTypeInput> {
    static ModelConfig = dataTypesConfig;
    static GraphQLSchema =  `
        type DataType {
            id: ID!
            name: String
            description: String
            typeConfig: JSON
            created: String
            updated: String
        }

        input CreateDataTypeInput {
            name: String!
            description: String
            typeConfig: JSON
        }

        input UpdateDataTypeInput {
            id: ID!
            name: String
            description: String
            typeConfig: JSON
        }
    `;

    constructor(client: es.Client, config: ManagerConfig) {
        super(client, config, dataTypesConfig);
    }
}

/**
 * The definition a DataType model
*/
export interface DataTypeModel extends BaseModel {
    /**
     * Name of the DataType
    */
    name: string;

    /**
     * Description of the DataType
    */
    description?: string;

    /**
     * Xlucene Type Config
    */
    typeConfig?: TypeConfig;
}

export type CreateDataTypeInput = CreateModel<DataTypeModel>;
export type UpdateDataTypeInput = UpdateModel<DataTypeModel>;

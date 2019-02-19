import * as es from 'elasticsearch';
import { Omit } from '@terascope/utils';
import spacesConfig from './config/spaces';
import { ManagerConfig } from '../interfaces';
import { Base, BaseModel } from './base';

/**
 * Manager for Spaces
*/
export class Spaces extends Base<SpaceModel, CreateSpaceInput, UpdateSpaceInput> {
    static ModelConfig = spacesConfig;
    static GraphQLSchema = `
        type Space {
            id: ID!
            name: String!
            description: String
            views: [String]
            created: String
            updated: String
        }

        input CreateSpaceInput {
            id: ID!
            name: String!
            description: String
            views: [String]
        }

        input UpdateSpaceInput {
            name: String!
            description: String
            views: [String]
        }
    `;

    constructor(client: es.Client, config: ManagerConfig) {
        super(client, config, spacesConfig);
    }
}

/**
 * The definition of a Space model
*/
export interface SpaceModel extends BaseModel {
    /**
     * Name of the Space, the name must be unique
    */
    name: string;

    /**
     * Description of the Role
    */
    description?: string;

    /**
     * A list of associated views
    */
    views: string[];
}

export type CreateSpaceInput = Omit<SpaceModel, (keyof BaseModel)>;
export type UpdateSpaceInput = Omit<SpaceModel, Exclude<(keyof BaseModel), 'id'>>;

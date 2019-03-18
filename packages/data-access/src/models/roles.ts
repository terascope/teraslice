import * as es from 'elasticsearch';
import rolesConfig from './config/roles';
import { ManagerConfig } from '../interfaces';
import { Base, BaseModel, CreateModel, UpdateModel } from './base';

/**
 * Manager for Roles
*/
export class Roles extends Base<RoleModel, CreateRoleInput, UpdateRoleInput> {
    static ModelConfig = rolesConfig;
    static GraphQLSchema =  `
        type Role {
            id: ID!
            name: String
            description: String
            created: String
            updated: String
        }

        input CreateRoleInput {
            name: String!
            description: String
        }

        input UpdateRoleInput {
            id: ID!
            name: String
            description: String
        }
    `;

    constructor(client: es.Client, config: ManagerConfig) {
        super(client, config, rolesConfig);
    }
}

/**
 * The definition a Role model
*/
export interface RoleModel extends BaseModel {
    /**
     * Name of the Role
    */
    name: string;

    /**
     * Description of the Role
    */
    description?: string;
}

export type CreateRoleInput = CreateModel<RoleModel>;
export type UpdateRoleInput = UpdateModel<RoleModel>;

import * as es from 'elasticsearch';
import { Omit } from '@terascope/utils';
import rolesConfig from './config/roles';
import { ManagerConfig } from '../interfaces';
import { Base, BaseModel } from './base';

/**
 * Manager for Roles
*/
export class Roles extends Base<RoleModel, CreateRoleInput, UpdateRoleInput> {
    static ModelConfig = rolesConfig;
    static GraphQLSchema =  `
        type Role {
            id: ID!
            name: String!
            description: String
            spaces: [String]
            created: String
            updated: String
        }

        input CreateRoleInput {
            name: String!
            description: String
            spaces: [String]
        }

        input UpdateRoleInput {
            id: ID!
            name: String!
            description: String
            spaces: [String]
        }
    `;

    constructor(client: es.Client, config: ManagerConfig) {
        super(client, config, rolesConfig);
    }

    async hasAccessToSpace(roleId: string, space: string): Promise<boolean> {
        const role = await this.findById(roleId);
        return role.spaces.includes(space);
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

    /**
     * A list of assocciated Spaces
    */
    spaces: string[];
}

export type CreateRoleInput = Omit<RoleModel, (keyof BaseModel)>;
export type UpdateRoleInput = Omit<RoleModel, Exclude<(keyof BaseModel), 'id'>>;

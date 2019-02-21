import * as es from 'elasticsearch';
import { Omit, uniq, TSError } from '@terascope/utils';
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
            name: String
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

    /** Associate space to multiple roles */
    async linkSpace(space: string, roles: string[]): Promise<void> {
        if (!roles || !roles.length) return;

        if (!space) {
            throw new TSError('Missing space id to attach roles to', {
                statusCode: 422
            });
        }

        await Promise.all(uniq(roles).map((id) => {
            return this.updateWith(id, {
                script: {
                    source: `
                        if (!ctx._source.spaces.contains(params.space)) {
                            ctx._source.spaces.add(params.space)
                        }
                    `,
                    lang: 'painless',
                    params: {
                        space,
                    }
                }
            });
        }));
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

import * as es from 'elasticsearch';
import { mapping, schema } from './mapping/roles';
import { ManagerConfig } from '../interfaces';
import { Base, BaseModel } from './base';

/**
 * Manager for Roles
*/
export class Roles extends Base<RoleModel> {
    constructor(client: es.Client, config: ManagerConfig) {
        super(client, {
            version: 1,
            name: 'roles',
            namespace: config.namespace,
            indexSchema: {
                version: 1,
                mapping,
            },
            dataSchema: {
                schema,
                strict: true,
                allFormatters: true,
            }
        });
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

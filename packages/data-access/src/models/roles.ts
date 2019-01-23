import { Base, BaseModel } from './base';

/**
 * Manager for Roles
*/
export class Roles extends Base<RoleModel> {
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

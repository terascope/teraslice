import { ModelFactory, BaseModel } from './base';
import { UserModel } from './users';

/**
 * Manager for Roles
*/
export class Roles extends ModelFactory<RoleModel> {
    async findAllForUser(user: UserModel, space: string): Promise<RoleModel[]> {
        const roleIds = user.roles;
        const query = `id:(${roleIds.join(' ')}) AND spaces:${space}`;
        return this.search(query, 1000, ['views']);
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
     *
     * QUESTION? Do we need this?
    */
    spaces: string[];

    /**
     * A list of assocciated Views
    */
    views: string[];
}

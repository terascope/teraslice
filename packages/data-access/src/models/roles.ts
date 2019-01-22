import { ModelFactory, BaseModel } from './base';

/**
 * Manager for Roles
*/
export class Roles extends ModelFactory<RoleModel> {
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

    /**
     * A list of assocciated Views
    */
    views: string[];
}

import * as es from 'elasticsearch';

/**
 * Manager for Roles
*/
export class Roles {
    constructor(client: es.Client) {

    }

    async create() {

    }

    async delete() {

    }

    async get() {

    }

    async update() {

    }
}

/**
 * The definition a Role model
*/
export interface RoleModel {
    /**
     * ID of the Role - UUIDv4
    */
    id: string;

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

    /** Updated date */
    updated: Date;

    /** Creation date */
    created: Date;
}

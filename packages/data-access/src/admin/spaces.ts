import * as es from 'elasticsearch';

/**
 * Manager for Spaces
*/
export class Spaces {
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
 * The definition of a Space model
*/
export interface SpaceModel {
    /**
     * ID of the Space - UUIDv4
    */
    id: string;

    /**
     * Name of the Space
    */
    name: string;

    /**
     * Description of the Role
    */
    description?: string;

    /** Updated date */
    updated: Date;

    /** Creation date */
    created: Date;
}

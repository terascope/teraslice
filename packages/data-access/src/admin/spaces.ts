/**
 * Manager for Spaces
*/
export class Spaces {

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

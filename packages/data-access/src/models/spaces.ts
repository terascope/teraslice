import { Base, BaseModel } from './base';

/**
 * Manager for Spaces
*/
export class Spaces extends Base<SpaceModel> {

}

/**
 * The definition of a Space model
*/
export interface SpaceModel extends BaseModel {
    /**
     * Name of the Space, the name must be unique
    */
    name: string;

    /**
     * Description of the Role
    */
    description?: string;

    /**
     * A list of associated views
    */
    views: [];
}

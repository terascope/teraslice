import { ModelFactory, BaseModel } from './base';

/**
 * Manager for Spaces
*/
export class Spaces extends ModelFactory<SpaceModel> {

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

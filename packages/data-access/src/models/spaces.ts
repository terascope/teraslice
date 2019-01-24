import * as es from 'elasticsearch';
import { mapping, schema } from './mapping/spaces';
import { ManagerConfig } from '../interfaces';
import { Base, BaseModel } from './base';

/**
 * Manager for Spaces
*/
export class Spaces extends Base<SpaceModel> {
    constructor(client: es.Client, config: ManagerConfig) {
        super(client, {
            version: 1,
            name: 'spaces',
            namespace: config.namespace,
            indexSchema: {
                version: 1,
                mapping,
            },
            dataSchema: {
                schema,
                strict: true,
                allFormatters: true,
            },
        });
    }

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
    views: string[];
}

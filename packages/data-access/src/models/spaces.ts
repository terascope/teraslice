import * as es from 'elasticsearch';
import { DataEntity, getFirst, TSError } from '@terascope/utils'; '';
import * as spacesConfig from './config/spaces';
import { ManagerConfig } from '../interfaces';
import { Base, BaseModel } from './base';

/**
 * Manager for Spaces
 *
 * @todo Enforce the name is unique
*/
export class Spaces extends Base<SpaceModel> {
    constructor(client: es.Client, config: ManagerConfig) {
        super(client, config, spacesConfig);
    }

    async findByIdOrName(idOrName: string): Promise<DataEntity<SpaceModel>> {
        const result = await this.find(`id:"${idOrName}" OR name:"${idOrName}"`, 1);

        const space = getFirst(result);
        if (space == null) {
            throw new TSError(`Unable to find space by "${idOrName}"`, {
                statusCode: 404,
            });
        }

        return space;
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

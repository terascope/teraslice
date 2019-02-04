import * as es from 'elasticsearch';
import { getFirst, TSError } from '@terascope/utils';
import { Base, BaseModel } from './base';
import * as viewsConfig from './config/views';
import { ManagerConfig } from '../interfaces';

/**
 * Manager for Views
*/
export class Views extends Base<ViewModel> {
    constructor(client: es.Client, config: ManagerConfig) {
        super(client, config, viewsConfig);
    }

    async getViewForRole(roleId: string, spaceId: string) {
        const query = `roles:"${roleId}" AND space:"${spaceId}"`;
        const result = getFirst(await this.find(query, 1));
        if (result == null) {
            const errMsg = `No View found for role "${roleId}" and space "${spaceId}"`;
            throw new TSError(errMsg, { statusCode: 404 });
        }
        return result;
    }
}

/**
 * The definition of a View model
 *
*/
export interface ViewModel extends BaseModel {
    /**
     * Name of the view
    */
    name: string;

    /**
     * Description of the view usage
    */
    description?: string;

    /**
     * The associated space
    */
    space: string;

    /**
     * The associated roles
    */
    roles: string[];

    /**
     * Fields to exclude
    */
    excludes?: string[];

    /**
     * Fields to include
    */
    includes?: string[];

    /**
     * Constraint for queries and filtering
    */
    constraint?: string;
}

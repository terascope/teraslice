import { ModelFactory, BaseModel } from './base';
import { RoleModel } from './roles';

/**
 * Manager for Views
*/
export class Views extends ModelFactory<ViewModel> {
    async findAllForRoles(roles: RoleModel[], space: string): Promise<ViewModel[]> {
        const viewIds: string[] = [];
        for (const role of roles) {
            viewIds.push(...role.views);
        }

        const query = `id:(${viewIds.join(' ')}) AND space:${space}`;
        return this.search(query, 1000);
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
     *
     * QUESTION? Should the view have a direct association with a Space?
     * If so would it be one-to-many or one-to-one?
    */
    space: string;

    /**
     * Restriction Type:
     *  - "whitelist" - will restrict the fields to only one specified
     *  - "blacklist" - will exclude any field specified
    */
    type: RestrictionType;

    /**
     * Fields to pick or omit
    */
    fields: string[];

    /**
     * Constraint for queries and filtering
    */
    constraint: string;
}

export type RestrictionType = 'whitelist'|'blacklist';

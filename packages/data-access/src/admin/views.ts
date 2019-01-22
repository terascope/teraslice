/**
 * Manager for Views
*/
export class Views {

}

/**
 * The definition of a View model
 *
 * QUESTION: Should the view have a direct association with a Space?
 * If so would it be one-to-many or one-to-one?
*/
export interface ViewModel {
    /**
     * ID of the view - UUIDv4
    */
    id: string;

    /**
     * Name of the view
    */
    name: string;

    /**
     * Description of the view usage
    */
    description?: string;

    /**
     * The list of associated Roles
    */
    roles: string[];

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

    /** Updated date */
    updated: Date;

    /** Creation date */
    created: Date;
}

export type RestrictionType = 'whitelist'|'blacklist';

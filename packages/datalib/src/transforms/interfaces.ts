export interface ExtractFieldConfig {
    regex?: string;
    isMultiValue: boolean;
    jexlExp?: string;
    start?: any;
    end?: any;
}

export interface MacAddressConfig {
    casing?: 'lowercase' | 'uppercase';
    removeGroups?: boolean;
}

export interface ReplaceLiteralConfig {
    search: string;
    replace: string;
}

export interface ReplaceRegexConfig {
    regex: string;
    replace: string;
    global?: boolean;
    ignoreCase?: boolean;
}

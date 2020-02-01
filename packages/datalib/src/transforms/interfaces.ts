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

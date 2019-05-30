export function validateFieldName(field: any): boolean {
    if (!field) return false;
    return /^[a-zA-Z0-9-_.]+$/.test(field);
}

export function validateFields(fields: string[]): boolean {
    if (!fields) return true;
    return fields.some(field => {
        return validateFieldName(field) ? false : true;
    });
}

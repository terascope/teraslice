export default class RecordValidation {
    static required(obj: any, fields: string[]) {
        const keys = Object.keys(obj);
        const hasKeys = fields.every((rField) => keys.includes(rField));
        if (hasKeys) return obj;
        // return null or {}
        return null;
    }
}

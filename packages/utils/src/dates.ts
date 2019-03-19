/**
 * A helper function for making an ISODate string
*/
export function makeISODate(): string {
    return new Date().toISOString();
}

/** A simplified implemation of moment(new Date(val)).isValid() */
export function isValidDate(val: any): boolean {
    const d = new Date(val);
    // @ts-ignore
    return d instanceof Date && !isNaN(d);
}

/** Check if the data is valid and return if it is */
export function getValidDate(val: any): Date|false {
    const d = new Date(val);
    // @ts-ignore
    return d instanceof Date && !isNaN(d) && d;
}

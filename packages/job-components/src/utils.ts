export function isString(val: any) {
    return typeof val === 'string';
}

export function random(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function uniq<T>(arr: T[]): T[] {
    return [...new Set(arr)];
}

export function times(n: number, fn: (index: number) => any) {
    let index = -1;
    const result = Array(n);

    while (++index < n) {
        result[index] = fn(index);
    }
    return result;
}

export function startsWith(str: string, val: string) {
    if (typeof str !== 'string') return false;
    return str.startsWith(val);
}

export function isValidDate(val: any): boolean {
    const d = new Date(val);
    // @ts-ignore
    return d instanceof Date && !isNaN(d);
}

export function flatten<T>(val: List<T[]>): T[] {
    return val.reduce((a, b) => a.concat(b), []);
}

interface List<T> extends Array<T> {
}

export function locked() {
    // @ts-ignore
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.configurable = false;
        descriptor.enumerable = false;
        descriptor.writable = false;
    };
}

export function enumerable(enabled: boolean) {
    // @ts-ignore
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.enumerable = enabled;
    };
}

export function isInteger(input: any): input is number {
    if (typeof input !== 'number') return false;

    return Number.isInteger(input);
}

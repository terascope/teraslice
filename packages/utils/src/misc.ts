export const isProd = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';
export const isDev = process.env.NODE_ENV === 'development';

/** A decorator for locking down a method */
export function locked() {
    // @ts-ignore
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.configurable = false;
        descriptor.enumerable = false;
        descriptor.writable = false;
    };
}

/** A decorator for making a method enumerable or none-enumerable */
export function enumerable(enabled = true) {
    // @ts-ignore
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.enumerable = enabled;
    };
}

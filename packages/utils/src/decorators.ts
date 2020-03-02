/** A decorator for locking down a method */
export function locked() {
    return function _locked(
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        descriptor.configurable = false;
        descriptor.enumerable = false;
        descriptor.writable = false;
    };
}

/** A decorator making changing the changing configurable property */
export function configurable(value: boolean) {
    return function _configurable(
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        descriptor.configurable = value;
    };
}

/** A decorator for making a method enumerable or none-enumerable */
export function enumerable(enabled = true) {
    // @ts-ignore
    return function _enumerable(
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        descriptor.enumerable = enabled;
    };
}

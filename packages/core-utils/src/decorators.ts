/** A decorator for locking down a method */
export function locked() {
    return function _locked(
        target: unknown,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ): void {
        descriptor.configurable = false;
        descriptor.enumerable = false;
        descriptor.writable = false;
    };
}

/** A decorator making changing the changing configurable property */
export function configurable(value: boolean) {
    return function _configurable(
        target: unknown,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ): void {
        descriptor.configurable = value;
    };
}

/** A decorator for making a method enumerable or none-enumerable */
export function enumerable(enabled = true) {
    return function _enumerable(
        target: unknown,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ): void {
        descriptor.enumerable = enabled;
    };
}

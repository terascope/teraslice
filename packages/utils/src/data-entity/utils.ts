export function setDataEntityProps(input: any): void {
    Object.defineProperties(input, {
        __isDataEntity: {
            value: true,
            enumerable: false,
            writable: false,
        }
    });
}

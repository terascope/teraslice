export interface APIFactoryRegistry<T, C> {
    get(name: string): T|undefined;
    getConfig(name: string): C|undefined;
    create(name: string, config: Partial<C>): Promise<T>;
    remove(name: string): Promise<void>;
    entries(): IterableIterator<[string, T]>;
    values(): IterableIterator<T>;
    keys(): IterableIterator<string>;
    size: number;
}

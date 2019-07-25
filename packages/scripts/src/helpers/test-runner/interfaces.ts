export type TestOptions = {
    bail?: boolean;
    debug?: boolean;
    filter?: string;
};

export type ScopeFn = (options: TestOptions) => Promise<void>;

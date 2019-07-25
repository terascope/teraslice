export type TestOptions = {
    bail?: boolean;
    debug?: boolean;
};

export type ScopeFn = (options: TestOptions) => Promise<void>;

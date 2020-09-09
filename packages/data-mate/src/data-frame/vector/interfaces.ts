import { Maybe } from '@terascope/types';

export type CoerceFn<T> = (value: Maybe<T>|unknown) => Maybe<T>;

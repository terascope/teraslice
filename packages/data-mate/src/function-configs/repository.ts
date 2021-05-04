import { booleanRepository } from './boolean';
import { geoRepository } from './geo';
import { jsonRepository } from './json';
import { numericRepository } from './numeric';
import { objectRepository } from './object';
import { stringRepository } from './string';
import { ipRepository } from './ip';

export const functionConfigRepository = {
    ...booleanRepository,
    ...geoRepository,
    ...jsonRepository,
    ...numericRepository,
    ...objectRepository,
    ...stringRepository,
    ...ipRepository
} as const;

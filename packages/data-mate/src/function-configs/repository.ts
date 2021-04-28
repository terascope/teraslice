import { booleanRepository } from './boolean';
import { geoRepository } from './geo';
import { jsonRepository } from './json';
import { numericRepository } from './numeric';
import { objectRepository } from './object';
import { stringRepository } from './string';

export const functionConfigRepository = {
    ...booleanRepository,
    ...geoRepository,
    ...jsonRepository,
    ...numericRepository,
    ...objectRepository,
    ...stringRepository
} as const;

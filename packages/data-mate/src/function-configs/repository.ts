import { booleanRepository } from './boolean';
import { dateRepository } from './date';
import { geoRepository } from './geo';
import { jsonRepository } from './json';
import { numericRepository } from './numeric';
import { objectRepository } from './object';
import { stringRepository } from './string';

export const functionConfigRepository = {
    ...booleanRepository,
    ...geoRepository,
    ...jsonRepository,
    ...dateRepository,
    ...numericRepository,
    ...objectRepository,
    ...stringRepository
} as const;

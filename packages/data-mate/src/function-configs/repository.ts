import { booleanRepository } from './boolean';
import { geoRepository } from './geo';
import { jsonRepository } from './json';
import { numberRepository } from './number';
import { objectRepository } from './object';
import { stringRepository } from './string';

export const functionConfigRepository = {
    ...booleanRepository,
    ...geoRepository,
    ...jsonRepository,
    ...numberRepository,
    ...objectRepository,
    ...stringRepository
} as const;

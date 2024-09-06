import { booleanRepository } from './boolean/index.js';
import { dateRepository } from './date/index.js';
import { geoRepository } from './geo/index.js';
import { jsonRepository } from './json/index.js';
import { numericRepository } from './numeric/index.js';
import { objectRepository } from './object/index.js';
import { stringRepository } from './string/index.js';
import { ipRepository } from './ip/index.js';

export const functionConfigRepository = {
    ...booleanRepository,
    ...geoRepository,
    ...jsonRepository,
    ...dateRepository,
    ...numericRepository,
    ...objectRepository,
    ...stringRepository,
    ...ipRepository
} as const;

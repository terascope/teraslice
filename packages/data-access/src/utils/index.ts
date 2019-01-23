import nanoid from 'nanoid/async';

export function makeISODate() {
    return new Date().toISOString();
}

export function makeId() {
    return nanoid(12);
}

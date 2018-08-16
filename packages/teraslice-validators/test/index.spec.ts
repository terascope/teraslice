/// <reference types="jest-extended" />

import * as index from '../src';

it('should have validateJobConfig available', () => {
    expect(index.validateJobConfig).toBeTruthy();
});

it('should have validateOpConfig available', () => {
    expect(index.validateOpConfig).toBeTruthy();
});

it('should have jobSchema available', () => {
    expect(index.jobSchema).toBeTruthy();
});

it('should have opSchema available', () => {
    expect(index.opSchema).toBeTruthy();
});

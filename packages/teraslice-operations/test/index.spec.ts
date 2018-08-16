/// <reference types="jest-extended" />

import * as index from '../src/index';

it('should be truthy', () => {
    expect(index).toBeTruthy();
});

it('should have a OperationLoader class', () => {
    expect(index.OperationLoader).toBeFunction();
});

it('should have a registerApis function', () => {
    expect(index.registerApis).toBeFunction();
});

it('should have a getOpConfig function', () => {
    expect(index.getOpConfig).toBeFunction();
});

it('should have a getClient function', () => {
    expect(index.getClient).toBeFunction();
});

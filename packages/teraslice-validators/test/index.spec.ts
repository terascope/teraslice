import { validators, schemas } from '../src';

it('should have validators.validateJobConfig available', () => {
    expect(validators.validateJobConfig).toBeTruthy();
});

it('should have validators.validateOpConfig available', () => {
    expect(validators.validateOpConfig).toBeTruthy();
});

it('should have schemas.jobSchema available', () => {
    expect(schemas.jobSchema).toBeTruthy();
});

it('should have schemas.commonSchema available', () => {
    expect(schemas.commonSchema).toBeTruthy();
});

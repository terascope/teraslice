import { validators, schemas } from '../src';

it('should have validators.validateJobConfig available', () => {
    expect(validators.validateJobConfig).toBeTruthy();
});

it('should have validators.validateOpConfig available', () => {
    expect(validators.validateOpConfig).toBeTruthy();
});

it('should have schemas.job.jobSchema available', () => {
    expect(schemas.job.jobSchema).toBeTruthy();
});

it('should have schemas.job.commonSchema available', () => {
    expect(schemas.job.commonSchema).toBeTruthy();
});

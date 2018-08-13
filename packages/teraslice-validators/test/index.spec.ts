import { Config, schemas } from '../src';

it('should have Config available', () => {
    expect(Config).toBeTruthy();
});

it('should have schemas.job.jobSchema available', () => {
    expect(schemas.job.jobSchema).toBeTruthy();
});

it('should have schemas.job.commonSchema available', () => {
    expect(schemas.job.commonSchema).toBeTruthy();
});

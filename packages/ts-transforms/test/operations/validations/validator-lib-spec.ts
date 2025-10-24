import { cloneDeep } from '@terascope/core-utils';
import { DataEntity } from '@terascope/entity-utils';
import crypto from 'crypto';
import { Validator, ValidatorPlugins } from '../../../src/operations/plugins/validator';
import { PostProcessConfig } from '../../../src/interfaces';

describe('validator lib', () => {
    const operationsClass = new ValidatorPlugins();
    const operations = operationsClass.init();

    function getValidator(opConfig: PostProcessConfig, method: keyof typeof operations): Validator {
        const Class = operations[method];
        return new Class(opConfig) as Validator;
    }

    function encode(str: string, type: string) {
        return Buffer.from(str).toString(type as any);
    }

    function makeHexidecimalNumber(num: number): string {
        let hexString = num.toString(16);
        if (hexString.length % 2) {
            hexString = `0${hexString}`;
        }
        return hexString;
    }

    const dataArray = [
        { field: 'hello world' },
        { field: 'something' },
        { field: 'world' },
        { field: '56.234,95.234' },
        { field: 123424 },
        { field: '56.234' },
        { field: [1324] },
        { field: { some: 'data' } },
        { field: true },
        { field: new Date().toISOString() },
        { field: '(d8sdf83$@' },
        { field: 'd8sdf83' },
    ];
    let data: DataEntity[] = [];

    beforeEach(() => {
        data = dataArray.map((obj) => new DataEntity(obj));
    });

    it('can call the after method', () => {
        const newDate = new Date('December 17, 1995 03:24:00').toISOString();
        const opConfig: PostProcessConfig = {
            follow: 'someId',
            source: 'field',
            target: 'field',
            value: newDate,
            __id: 'someId',
        };
        const test = getValidator(opConfig, 'after');

        const results = cloneDeep(data).reduce<any[]>((arr: any[], obj: any) => {
            const result = test.run(obj);
            arr.push(result);
            return arr;
        }, []);

        expect(results[0]).toEqual(null);
        expect(results[1]).toEqual(null);
        expect(results[2]).toEqual(null);
        expect(results[3]).toEqual(null);
        expect(results[4]).toEqual(null);
        expect(results[5]).toEqual(null);
        expect(results[6]).toEqual(null);
        expect(results[7]).toEqual(null);
        expect(results[8]).toEqual(null);
        expect(results[9]).toEqual(data[9]);
        expect(results[10]).toEqual(null);
    });

    it('can call the base64 method', () => {
        const opConfig: PostProcessConfig = {
            follow: 'someId', source: 'field', target: 'field', __id: 'someId'
        };
        const test = getValidator(opConfig, 'base64');

        const data1 = new DataEntity({ field: 'hello world' });
        const data2 = new DataEntity({ field: encode('hello world', 'base64') });

        const results1 = test.run(data1);
        const results2 = test.run(data2);

        expect(results1).toEqual(null);
        expect(results2).toEqual(data2);
    });

    it('can call the before method', () => {
        const newDate = new Date().toISOString();
        const opConfig: PostProcessConfig = {
            follow: 'someId',
            source: 'field',
            target: 'field',
            value: newDate,
            __id: 'someId',
        };
        const test = getValidator(opConfig, 'before');

        const results = cloneDeep(data).reduce<any[]>((arr: any[], obj: any) => {
            const result = test.run(obj);
            arr.push(result);
            return arr;
        }, []);

        expect(results[0]).toEqual(null);
        expect(results[1]).toEqual(null);
        expect(results[2]).toEqual(null);
        expect(results[3]).toEqual(null);
        expect(results[4]).toEqual(null);
        expect(results[5]).toEqual(null);
        expect(results[6]).toEqual(null);
        expect(results[7]).toEqual(null);
        expect(results[8]).toEqual(null);
        expect(results[9]).toEqual(data[9]);
        expect(results[10]).toEqual(null);
    });

    it('can call the bytelength method', () => {
        const opConfig: PostProcessConfig = {
            follow: 'someId',
            source: 'field',
            target: 'field',
            min: 2,
            max: 6,
            __id: 'someId',
        };
        const test = getValidator(opConfig, 'bytelength');

        const results = cloneDeep(data).reduce<any[]>((arr: any[], obj: any) => {
            const result = test.run(obj);
            arr.push(result);
            return arr;
        }, []);

        expect(results[0]).toEqual(null);
        expect(results[1]).toEqual(null);
        expect(results[2]).toEqual(data[2]);
        expect(results[3]).toEqual(null);
        expect(results[4]).toEqual(null);
        expect(results[5]).toEqual(data[5]);
        expect(results[6]).toEqual(null);
        expect(results[7]).toEqual(null);
        expect(results[8]).toEqual(null);
        expect(results[9]).toEqual(null);
        expect(results[10]).toEqual(null);
    });

    it('can call the creditcard method', () => {
        const opConfig: PostProcessConfig = {
            follow: 'someId', source: 'field', target: 'field', __id: 'someId'
        };
        const test = getValidator(opConfig, 'creditcard');

        const cardData = new DataEntity({ field: '4945271443377285' });
        const results = cloneDeep(data).reduce<any[]>((arr: any[], obj: any) => {
            const result = test.run(obj);
            arr.push(result);
            return arr;
        }, []);

        results.forEach((result) => expect(result).toEqual(null));
        expect(test.run(cardData)).toEqual(cardData);
    });

    it('can call the currency method', () => {
        const opConfig: PostProcessConfig = {
            follow: 'someId',
            source: 'field',
            target: 'field',
            // @ts-expect-error FIXME
            allow_space_after_symbol: true,
            __id: 'someId',
        };
        const test = getValidator(opConfig, 'currency');

        const money1 = new DataEntity({ field: '$120.12' });
        const money2 = new DataEntity({ field: '$ 120.12' });
        const money3 = new DataEntity({ field: '$1,220.12' });

        const results = cloneDeep(data).reduce<any[]>((arr: any[], obj: any) => {
            const result = test.run(obj);
            arr.push(result);
            return arr;
        }, []);

        results.forEach((result) => expect(result).toEqual(null));
        expect(test.run(money1)).toEqual(money1);
        expect(test.run(money2)).toEqual(money2);
        expect(test.run(money3)).toEqual(money3);
    });

    it('can call the decimal method', () => {
        const opConfig: PostProcessConfig = {
            follow: 'someId', source: 'field', target: 'field', __id: 'someId'
        };
        const test = getValidator(opConfig, 'decimal');

        const results = cloneDeep(data).reduce<any[]>((arr: any[], obj: any) => {
            const result = test.run(obj);
            arr.push(result);
            return arr;
        }, []);

        expect(results[0]).toEqual(null);
        expect(results[1]).toEqual(null);
        expect(results[2]).toEqual(null);
        expect(results[3]).toEqual(null);
        expect(results[4]).toEqual(null);
        expect(results[5]).toEqual(data[5]);
        expect(results[6]).toEqual(null);
        expect(results[7]).toEqual(null);
        expect(results[8]).toEqual(null);
        expect(results[9]).toEqual(null);
        expect(results[10]).toEqual(null);
    });

    it('can call the empty method', () => {
        const opConfig: PostProcessConfig = {
            follow: 'someId', source: 'field', target: 'field', __id: 'someId'
        };
        const test = getValidator(opConfig, 'empty');

        const data1 = { field: null, other: 'things' };
        const data2 = { field: '', other: 'things' };
        const data3 = { field: false };

        const noStr1 = new DataEntity(data1);
        const noStr2 = new DataEntity(data2);
        const noStr3 = new DataEntity({ other: 'things' });
        const noStr4 = new DataEntity(data3);

        const resultsArray = data.map((obj) => test.run(obj));
        const results1 = test.run(noStr1);
        const results2 = test.run(noStr2);
        const results3 = test.run(noStr3);
        const results4 = test.run(noStr4);

        resultsArray.forEach((result) => expect(result).toEqual(null));
        expect(results1).toEqual(noStr3);
        expect(results2).toEqual(data2);
        expect(results3).toEqual(noStr3);
        expect(results4).toEqual(null);
    });

    it('can call the float method', () => {
        const opConfig: PostProcessConfig = {
            follow: 'someId', source: 'field', target: 'field', __id: 'someId'
        };
        const test = getValidator(opConfig, 'float');

        const results = cloneDeep(data).reduce<any[]>((arr: any[], obj: any) => {
            const result = test.run(obj);
            arr.push(result);
            return arr;
        }, []);

        expect(results[0]).toEqual(null);
        expect(results[1]).toEqual(null);
        expect(results[2]).toEqual(null);
        expect(results[3]).toEqual(null);
        expect(results[4]).toEqual(null);
        expect(results[5]).toEqual(data[5]);
        expect(results[6]).toEqual(null);
        expect(results[7]).toEqual(null);
        expect(results[8]).toEqual(null);
        expect(results[9]).toEqual(null);
        expect(results[10]).toEqual(null);
    });

    it('can call the hash method', () => {
        const opConfig: PostProcessConfig = {
            follow: 'someId',
            source: 'field',
            target: 'field',
            value: 'sha256',
            __id: 'someId',
        };
        const test = getValidator(opConfig, 'hash');

        const sha256Hash = crypto.createHash('sha256');
        const sha1Hash = crypto.createHash('sha1');

        const str = 'hello hashing world';
        sha256Hash.update(str);
        sha1Hash.update(str);
        const data1 = sha1Hash.digest('hex');
        const data256 = sha256Hash.digest('hex');

        const results1 = new DataEntity({ field: data1 });
        const results2 = new DataEntity({ field: data256 });

        const results = cloneDeep(data).reduce<any[]>((arr: any[], obj: any) => {
            const result = test.run(obj);
            arr.push(result);
            return arr;
        }, []);

        results.forEach((result) => expect(result).toEqual(null));
        expect(test.run(results1)).toEqual(null);
        expect(test.run(results2)).toEqual(results2);
    });

    it('can call the hexadecimal method', () => {
        const opConfig: PostProcessConfig = {
            follow: 'someId', source: 'field', target: 'field', __id: 'someId'
        };
        const test = getValidator(opConfig, 'hexadecimal');

        const results1 = new DataEntity({ field: makeHexidecimalNumber(1234234) });

        const results = cloneDeep(data).reduce<any[]>((arr: any[], obj: any) => {
            const result = test.run(obj);
            arr.push(result);
            return arr;
        }, []);
        results.forEach((result) => expect(result).toEqual(null));
        expect(test.run(results1)).toEqual(results1);
    });

    it('can call the issn method', () => {
        const opConfig: PostProcessConfig = {
            follow: 'someId', source: 'field', target: 'field', __id: 'someId'
        };
        const test = getValidator(opConfig, 'issn');

        const results1 = new DataEntity({ field: '0317-8471' });

        const results = cloneDeep(data).reduce<any[]>((arr: any[], obj: any) => {
            const result = test.run(obj);
            arr.push(result);
            return arr;
        }, []);
        results.forEach((result) => expect(result).toEqual(null));
        expect(test.run(results1)).toEqual(results1);
    });

    it('can call the iso8601 method', () => {
        const opConfig: PostProcessConfig = {
            follow: 'someId', source: 'field', target: 'field', __id: 'someId'
        };
        const test = getValidator(opConfig, 'iso8601');

        const results = cloneDeep(data).reduce<any[]>((arr: any[], obj: any) => {
            const result = test.run(obj);
            arr.push(result);
            return arr;
        }, []);
        results.forEach((result, ind) => {
            if (ind === 9) {
                expect(result).toEqual(dataArray[ind]);
            } else {
                expect(result).toEqual(null);
            }
        });
    });

    it('can call the rfc3339 method', () => {
        const opConfig: PostProcessConfig = {
            follow: 'someId', source: 'field', target: 'field', __id: 'someId'
        };
        const test = getValidator(opConfig, 'rfc3339');

        const results1 = new DataEntity({ field: new Date().toString() });
        const results2 = new DataEntity({ field: new Date().toUTCString() });
        const results3 = new DataEntity({ field: new Date().toTimeString() });

        const results = cloneDeep(data).reduce<any[]>((arr: any[], obj: any) => {
            const result = test.run(obj);
            arr.push(result);
            return arr;
        }, []);
        results.forEach((result, ind) => {
            if (ind === 9) {
                expect(result).toEqual(dataArray[ind]);
            } else {
                expect(result).toEqual(null);
            }
        });
        expect(test.run(results1)).toEqual(null);
        expect(test.run(results2)).toEqual(null);
        expect(test.run(results3)).toEqual(null);
    });

    it('can call the iso31661alpha2 method', () => {
        const opConfig: PostProcessConfig = {
            follow: 'someId', source: 'field', target: 'field', __id: 'someId'
        };
        const test = getValidator(opConfig, 'iso31661alpha2');

        const results1 = new DataEntity({ field: 'US' });
        const results2 = new DataEntity({ field: 'us' });

        const results = cloneDeep(data).reduce<any[]>((arr: any[], obj: any) => {
            const result = test.run(obj);
            arr.push(result);
            return arr;
        }, []);
        results.forEach((result) => expect(result).toEqual(null));

        expect(test.run(results1)).toEqual(results1);
        expect(test.run(results2)).toEqual(results2);
    });

    it('can call the iso31661alpha3 method', () => {
        const opConfig: PostProcessConfig = {
            follow: 'someId', source: 'field', target: 'field', __id: 'someId'
        };
        const test = getValidator(opConfig, 'iso31661alpha3');

        const results1 = new DataEntity({ field: 'USA' });
        const results2 = new DataEntity({ field: 'usa' });

        const results = cloneDeep(data).reduce<any[]>((arr: any[], obj: any) => {
            const result = test.run(obj);
            arr.push(result);
            return arr;
        }, []);
        results.forEach((result) => expect(result).toEqual(null));

        expect(test.run(results1)).toEqual(results1);
        expect(test.run(results2)).toEqual(results2);
    });

    it('can call the in method', () => {
        const opConfig: PostProcessConfig = {
            follow: 'someId',
            source: 'field',
            target: 'field',
            value: ['hello world'],
            __id: 'someId',
        };
        const test = getValidator(opConfig, 'in');

        const results = cloneDeep(data).reduce<any[]>((arr: any[], obj: any) => {
            const result = test.run(obj);
            arr.push(result);
            return arr;
        }, []);

        results.forEach((result, ind) => {
            if (ind === 0) {
                expect(result).toEqual(dataArray[ind]);
            } else {
                expect(result).toEqual(null);
            }
        });
    });

    it('can call the int method', () => {
        const opConfig: PostProcessConfig = {
            follow: 'someId', source: 'field', target: 'field', __id: 'someId'
        };
        const test = getValidator(opConfig, 'int');

        const obj = { field: '1234234' };
        const data1 = new DataEntity(obj);
        const results1 = test.run(data1);

        const results = data.map((d) => test.run(d));
        results.forEach((result) => expect(result).toEqual(null));
        expect(results1).toEqual(obj);
    });

    it('can call the latlong method', () => {
        const opConfig: PostProcessConfig = {
            follow: 'someId', source: 'field', target: 'field', __id: 'someId'
        };
        const test = getValidator(opConfig, 'latlong');

        const results = cloneDeep(data).reduce<any[]>((arr: any[], obj: any) => {
            const result = test.run(obj);
            arr.push(result);
            return arr;
        }, []);
        results.forEach((result, ind) => {
            if (ind === 3) {
                expect(result).toEqual(dataArray[ind]);
            } else {
                expect(result).toEqual(null);
            }
        });
    });

    it('can call the length method', () => {
        const opConfig: PostProcessConfig = {
            follow: 'someId',
            source: 'field',
            target: 'field',
            min: 5,
            max: 6,
            __id: 'someId',
        };
        const test = getValidator(opConfig, 'length');

        const results = cloneDeep(data).reduce<any[]>((arr: any[], obj: any) => {
            const result = test.run(obj);
            arr.push(result);
            return arr;
        }, []);
        results.forEach((result, ind) => {
            if (ind === 2 || ind === 5) {
                expect(result).toEqual(dataArray[ind]);
            } else {
                expect(result).toEqual(null);
            }
        });
    });

    it('can call the md5 method', () => {
        const opConfig: PostProcessConfig = {
            follow: 'someId', source: 'field', target: 'field', __id: 'someId'
        };
        const test = getValidator(opConfig, 'md5');

        const md5 = crypto.createHash('md5');
        const str = 'hello hashing world';
        md5.update(str);

        const obj = { field: md5.digest('hex') };
        const data1 = new DataEntity(obj);
        const results1 = test.run(data1);

        const results = data.map((o) => test.run(o));
        results.forEach((result) => expect(result).toEqual(null));
        expect(results1).toEqual(obj);
    });

    it('can call the mimetype method', () => {
        const opConfig: PostProcessConfig = {
            follow: 'someId', source: 'field', target: 'field', __id: 'someId'
        };
        const test = getValidator(opConfig, 'mimetype');

        const obj = { field: 'application/javascript' };
        const data1 = new DataEntity(obj);
        const results1 = test.run(data1);

        const results = data.map((o) => test.run(o));
        results.forEach((result) => expect(result).toEqual(null));
        expect(results1).toEqual(obj);
    });

    it('can call the numeric method', () => {
        const opConfig: PostProcessConfig = {
            follow: 'someId', source: 'field', target: 'field', __id: 'someId'
        };
        const test = getValidator(opConfig, 'numeric');

        const results = cloneDeep(data).reduce<any[]>((arr: any[], obj: any) => {
            const result = test.run(obj);
            arr.push(result);
            return arr;
        }, []);

        results.forEach((result, ind) => {
            if (ind === 5) {
                expect(result).toEqual(dataArray[ind]);
            } else {
                expect(result).toEqual(null);
            }
        });
    });

    it('can call the port method', () => {
        const opConfig: PostProcessConfig = {
            follow: 'someId', source: 'field', target: 'field', __id: 'someId'
        };
        const test = getValidator(opConfig, 'port');

        const obj = { field: '1234' };
        const obj2 = { field: 1234 };

        const data1 = new DataEntity(obj);
        const data2 = new DataEntity(obj2);

        const results1 = test.run(data1);
        const results2 = test.run(data2);

        const results = data.map((o) => test.run(o));
        results.forEach((result) => expect(result).toEqual(null));

        expect(results1).toEqual(obj);
        expect(results2).toEqual(null);
    });

    it('can call the postalcode method', () => {
        const opConfig: PostProcessConfig = {
            follow: 'someId', source: 'field', target: 'field', value: 'US', __id: 'someId'
        };
        const test = getValidator(opConfig, 'postalcode');

        const obj = { field: '12345' };
        const obj2 = { field: '12345-1234' };

        const data1 = new DataEntity(obj);
        const data2 = new DataEntity(obj2);

        const results1 = test.run(data1);
        const results2 = test.run(data2);

        const results = data.map((o) => test.run(o));
        results.forEach((result) => expect(result).toEqual(null));

        expect(results1).toEqual(obj);
        expect(results2).toEqual(obj2);
    });

    it('can call the matches method', () => {
        const opConfig: PostProcessConfig = {
            follow: 'someId',
            source: 'field',
            target: 'field',
            value: /world/,
            __id: 'someId',
        };
        const test = getValidator(opConfig, 'matches');

        const results = cloneDeep(data).reduce<any[]>((arr: any[], obj: any) => {
            const result = test.run(obj);
            arr.push(result);
            return arr;
        }, []);

        results.forEach((result, ind) => {
            if (ind === 0 || ind === 2) {
                expect(result).toEqual(dataArray[ind]);
            } else {
                expect(result).toEqual(null);
            }
        });
    });

    it('can call the alpha method', () => {
        const opConfig: PostProcessConfig = {
            follow: 'someId', source: 'field', target: 'field', value: 'en-US', __id: 'someId'
        };

        const test = getValidator(opConfig, 'alpha');

        const obj = { value: 'someAlphaValue' };

        const data1 = new DataEntity(obj);

        const results1 = test.run(data1);

        expect(results1).toEqual(obj);
    });
});

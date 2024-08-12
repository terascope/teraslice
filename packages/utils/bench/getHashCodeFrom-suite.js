import { Suite } from './helpers.js';
import { getHashCodeFrom, isExecutedFile } from '../dist/src/index.js';

const run = async () => {
    const str6 = Array.from({ length: 6 }, () => 'a').join('');
    const str26 = Array.from({ length: 26 }, () => 'a').join('');
    const str36 = Array.from({ length: 36 }, () => 'a').join('');
    const singleObj = { a: 1 };
    const multiObj = {
        a: 1,
        b: 2,
        c: 3,
        d: 4,
        e: 5,
        f: 6,
        g: 7
    };
    const arrSingleObj = [singleObj];
    const arrMultiObj = [multiObj];

    const multiArrSingleObj = Array.from({ length: 5 }, () => singleObj);
    const multiArrMultiObj = Array.from({ length: 5 }, () => multiObj);

    return Suite('getHashCodeFrom')
        .add('with a 6 character string', {
            fn() {
                getHashCodeFrom(str6);
            }
        })
        .add('with a 26 character string', {
            fn() {
                getHashCodeFrom(str26);
            }
        })
        .add('with a 36 character string', {
            fn() {
                getHashCodeFrom(str36);
            }
        })
        .add('with a single property object', {
            fn() {
                getHashCodeFrom(singleObj);
            }
        })
        .add('with a multiple property object', {
            fn() {
                getHashCodeFrom(multiObj);
            }
        })
        .add('with an array with a single property object', {
            fn() {
                getHashCodeFrom(arrSingleObj);
            }
        })
        .add('with an array with a multiple property object', {
            fn() {
                getHashCodeFrom(arrMultiObj);
            }
        })
        .add('with a multi-item array with a single prop obj', {
            fn() {
                getHashCodeFrom(multiArrSingleObj);
            }
        })
        .add('with a multi-item array with a multi-prop obj', {
            fn() {
                getHashCodeFrom(multiArrMultiObj);
            }
        })
        .run({
            async: true,
            initCount: 2,
            maxTime: 20,
        });
};

export default run;

if (isExecutedFile(import.meta.url)) {
    run().then((suite) => {
        suite.on('complete', () => {});
    });
}

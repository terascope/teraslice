'use strict';

const errorParser = require('../index.js');

describe('error_parser', () => {

    it('returns a function', () =>{
        expect(typeof errorParser).toEqual('function')
    });

    it('can parse regular errors', () => {
        const message = 'i am an error';
        const error = new Error(message);
        const parsedError= errorParser(error);

        expect(parsedError).toEqual(error.stack)
    });

    it('can handle other error responses or return error as it', () => {
        const responseError = { response: 'i am an error response' };
        const other = 'i return as is';

        expect(errorParser(responseError)).toEqual(responseError.response);
        expect(errorParser(other)).toEqual(other);
    });

    it('can handle elasticsearch errors', () => {
       const msg = 'i am a elasticsearch error';
       const errorData = {
            toJSON(){ return { msg }}
        };

       expect(errorParser(errorData)).toEqual(msg)
    });

    it('can return better error messages for index not found errors', () => {
        const msg = 'i am a elasticsearch error';
        const errorData = {
            toJSON(){ return { msg }},
            body: {
                error: {
                    type: 'index_not_found_exception',
                    index: 'someIndex'
                }
            }
        };
        const expectedErrorMsg = `error: index_not_found_exception, could not find index: ${errorData.body.error.index}`
        expect(errorParser(errorData)).toEqual(expectedErrorMsg)
    });

    it('can return better error messages for search errors', () => {
        const msg = 'i am a elasticsearch error';
        const cause = {
            type: 'errorType',
            index: 'someIndex',
            reason: 'justBecause'
        };
        const errorData = {
            toJSON(){ return { msg }},
            body: {
                error: {
                    type: 'search_phase_execution_exception',
                    root_cause: [cause]
                }
            }
        };
        const expectedErrorMsg = `error: ${cause.type} ${cause.reason} on index: ${cause.index}`;
        expect(errorParser(errorData)).toEqual(expectedErrorMsg)
    })

    it('will truncate error messages to 5k length', () => {
        const msg = 'i am a elasticsearch error';
        let longErrorMsg = '';

        while (longErrorMsg.length < 5000){
            longErrorMsg += 'a';
        }

        expect(errorParser(msg)).toEqual(msg)
        expect(errorParser(msg).length).toEqual(msg.length)

        expect(errorParser(longErrorMsg)).toEqual(`${longErrorMsg} ...`);
        expect(errorParser(longErrorMsg).length).toEqual(longErrorMsg.length + 4)
    })

});

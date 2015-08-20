'use strict';

module.exports = [
    {
        name: 'required_String',
        validate: function(val){
            if (!(val && typeof val === 'string')) {
                throw new Error('This field is required and must by of type string')
            }
        },
        coerce: function(val){
            return val;
        }
    },

{
    name: 'optional_String',
    validate: function(val){
        if (val && typeof val !== 'string') {
            throw new Error('This field is optional but if specified it must be of type string')
        }
    },
    coerce: function(val){
        return val;
    }
}
];
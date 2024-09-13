import React from 'react';
import { trim } from '@terascope/utils';

 // eslint-disable-next-line react-hooks/exhaustive-deps

  // eslint-disable-next-line react-hooks/fake-rule

console.log("hi")
function Code({ children, _inline, style, _size = 'large', }) {
    return (React.createElement("pre", { style: style }, trim(children)));
}

export default Code;

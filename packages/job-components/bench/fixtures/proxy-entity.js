'use strict';

const _metadata = new WeakMap();

module.exports = function make(data, metadata) {
    const proxy = new Proxy(data, {});
    _metadata.set(proxy, Object.assign({ createdAt: Date.now() }, metadata));
    return proxy;
};

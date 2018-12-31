/**
 * @param {*} x
 * @return {boolean}
 */
export function isObject(x) {
    const type = typeof x;
    return x !== null && (type === 'object' || type === 'function');
}

/**
 * @param {*} x
 * @return {boolean}
 */
export function isPlainObject(x) {
    if (Object.prototype.toString.call(x) !== '[object Object]') {
        return false;
    }
    const prototype = Object.getPrototypeOf(x);
    return prototype === null || prototype === Object.getPrototypeOf({});
}

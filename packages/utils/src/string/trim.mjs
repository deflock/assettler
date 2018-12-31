/**
 * -------------------------------------------
 * |  Input                      |  Output   |
 * -------------------------------------------
 * |  `('//str' ,'/')`           |  `str`    |
 * |  `('/a/str' ,'/')`          |  `a/str`  |
 * |  `('_trim_str' ,'_trim_')`  |  `str`    |
 * |  `('*****str' ,'*')`        |  `str`    |
 * |  `('*****str' ,'**')`       |  `*str`   |
 * |  `('*****str' ,'***')`      |  `**str`  |
 * -------------------------------------------
 *
 * @param {string} str
 * @param {string} trimStr
 * @returns {string}
 */
export function trimStringLeft(str, trimStr) {
    return _trimString(str, trimStr, false);
}

/**
 * -------------------------------------------
 * |  Input                      |  Output   |
 * -------------------------------------------
 * |  `('str//' ,'/')`           |  `str`    |
 * |  `('str/a/' ,'/')`          |  `str/a`  |
 * |  `('str_trim_' ,'_trim_')`  |  `str`    |
 * |  `('str*****' ,'*')`        |  `str`    |
 * |  `('str*****' ,'**')`       |  `str*`   |
 * |  `('str*****' ,'***')`      |  `str**`  |
 * -------------------------------------------
 *
 * @param {string} str
 * @param {string} trimStr
 * @returns {string}
 */
export function trimStringRight(str, trimStr) {
    return _trimString(str, trimStr, true);
}

/**
 * ---------------------------------------------------
 * |  Input                            |  Output     |
 * ---------------------------------------------------
 * |  `('//str//' ,'/')`               |  `str`      |
 * |  `('/a/str/a/' ,'/')`             |  `a/str/a`  |
 * |  `('_trim_str_trim_' ,'_trim_')`  |  `str`      |
 * |  `('*****str*****' ,'*')`         |  `str`      |
 * |  `('*****str*****' ,'**')`        |  `*str*`    |
 * |  `('*****str*****' ,'***')`       |  `**str**`  |
 * ---------------------------------------------------
 *
 * @param {string} str
 * @param {string} trimStr
 * @returns {string}
 */
export function trimString(str, trimStr) {
    return _trimString(_trimString(str, trimStr, true), trimStr, false);
}

/**
 * @private
 *
 * @param {string} str
 * @param {string} trimStr
 * @param {boolean} isRight
 * @returns {string}
 */
function _trimString(str, trimStr, isRight = true) {
    if (str === '') {
        return '';
    }

    if (typeof trimStr !== 'string') {
        // eslint-disable-next-line no-param-reassign
        trimStr = trimStr.toString();
    }

    if (trimStr === '') {
        return str;
    }

    let result;

    if (isRight) {
        let pos = str.length;

        while (str.indexOf(trimStr, pos - trimStr.length) === pos - trimStr.length) {
            pos -= trimStr.length;
        }

        result = pos < str.length ? str.substr(0, pos) : str;
    }
    else {
        let pos = 0;

        while (str.indexOf(trimStr, pos) === pos) {
            pos += trimStr.length;
        }

        result = pos > 0 ? str.substr(pos) : str;
    }

    return result;
}

/**
 * @param {string} str
 * @param {string|Array} chars
 * @returns {string}
 */
export function trimCharsLeft(str, chars) {
    return _trimChars(str, chars, false);
}

/**
 * @param {string} str
 * @param {string|Array} chars
 * @returns {string}
 */
export function trimCharsRight(str, chars) {
    return _trimChars(str, chars, true);
}

/**
 * @param {string} str
 * @param {string|Array} chars
 * @returns {string}
 */
export function trimChars(str, chars) {
    return _trimChars(_trimChars(str, chars, true), chars, false);
}

/**
 * @private
 *
 * @param {string} str
 * @param {string|Array} chars
 * @param {boolean} isRight
 * @returns {string}
 */
function _trimChars(str, chars, isRight = true) {
    if (str === '') {
        return '';
    }

    if (typeof chars === 'string') {
        // eslint-disable-next-line no-param-reassign
        chars = chars.split('');
    }
    else if (!Array.isArray(chars)) {
        // eslint-disable-next-line no-param-reassign
        chars = [chars.toString()];
    }

    if (!chars.length) {
        return str;
    }

    let result;

    if (isRight) {
        let pos = str.length - 1;

        while (pos >= 0 && chars.indexOf(str[pos]) >= 0) {
            pos--;
        }

        // eslint-disable-next-line no-nested-ternary
        result = pos >= 0
            ? (pos < str.length - 1 ? str.substr(0, pos + 1) : str)
            : '';
    }
    else {
        let pos = 0;

        while (pos < str.length && chars.indexOf(str[pos]) >= 0) {
            pos++;
        }

        // eslint-disable-next-line no-nested-ternary
        result = pos < str.length
            ? (pos > 0 ? str.substr(pos) : str)
            : '';
    }

    return result;
}

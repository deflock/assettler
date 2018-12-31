import nodefs from 'fs';
import nodepath from 'path';
import mkdirp from 'mkdirp';
import globby from 'globby';

/**
 * @param {string} filepath
 * @param {string} content
 * @param {string|Object} options
 */
export function writeFile(filepath, content, options = 'utf8') {
    mkdirp.sync(nodepath.dirname(filepath));
    nodefs.writeFileSync(filepath, content, options);
}

/**
 * @param {string} filepath
 * @param {*} value
 * @param {string|Object} options
 */
export function writeAsJson(filepath, value, options = 'utf8') {
    writeFile(filepath, JSON.stringify(value, null, 2), options);
}

/**
 * @param {string|Array} pattern
 * @param {string|Object} dir
 * @param {Object} options
 * @returns {Array}
 */
export function getFiles(pattern, dir, options = {}) {
    if (typeof dir === 'object') {
        // eslint-disable-next-line no-param-reassign
        options = dir;
        // eslint-disable-next-line no-param-reassign
        dir = null;
    }

    // eslint-disable-next-line no-param-reassign
    options = Object.assign({
        nodir: true,
    }, options);

    if (dir) {
        options.cwd = dir;
    }

    return globby.sync(pattern, options).map(nodepath.normalize);
}

/**
 * @param {string} dir
 * @param {Object} options
 * @returns {Array}
 */
export function getDirFiles(dir, options = {}) {
    return getFiles('**/*', dir, options);
}

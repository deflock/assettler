import nodepath from 'path';
import {trimCharsLeft, trimCharsRight} from './string/trim';

/**
 * @param {string} path
 * @param {string} basepath
 * @param {Object} options
 * @returns {Object}
 */
export function relativeAndAbsolute(path, basepath = process.cwd(), options = {}) {
    const {
        isBasePathFile = false,
        relativePrependDot = false,
    } = options;

    const basedir = isBasePathFile && basepath ? nodepath.dirname(basepath) : basepath;

    let absolute;
    let relative;

    if (nodepath.isAbsolute(path)) {
        absolute = path;
        relative = nodepath.relative(basedir, path);
    }
    else {
        relative = path;
        absolute = nodepath.resolve(basedir, path);
    }

    if (relative[0] !== '.' && relativePrependDot) {
        relative = `./${relative}`;
    }

    return {
        relative,
        absolute,
    };
}

/**
 * @param {string} path
 * @param {string|Array} exts
 * @return {boolean}
 */
export function pathMatchesExtension(path, exts) {
    return extensionMatches(nodepath.extname(path), exts);
}

/**
 * @param {string|Array} srcExts
 * @param {string|Array} targetExts
 * @returns {boolean}
 */
export function extensionMatches(srcExts, targetExts) {
    if (!Array.isArray(srcExts)) {
        // eslint-disable-next-line no-param-reassign
        srcExts = [srcExts];
    }
    if (!Array.isArray(targetExts)) {
        // eslint-disable-next-line no-param-reassign
        targetExts = [targetExts];
    }

    for (const i of srcExts) {
        for (const j of targetExts) {
            if (i === j || `.${i}` === j || i === `.${j}`) {
                return true;
            }
        }
    }

    return false;
}

/**
 * @param {string} path
 * @param {string|Array|null} exts
 * @returns {string}
 */
export function stripExtension(path, exts = null) {
    if (exts == null) {
        return nodepath.join(nodepath.dirname(path), nodepath.basename(path, nodepath.extname(path)));
    }

    if (!Array.isArray(exts)) {
        // eslint-disable-next-line no-param-reassign
        exts = [exts];
    }

    for (const ext of exts) {
        if (path.endsWith(ext)) {
            return path.substr(0, path.length - ext.length);
        }
        // eslint-disable-next-line no-else-return
        else if (path.endsWith(`.${ext}`)) {
            return path.substr(0, path.length - ext.length - 1);
        }
    }

    return path;
}

/**
 * @param {string} path
 * @param {boolean} needsRightSlash
 * @param {boolean|null} needsLeftSlash
 * @returns {string}
 */
export function ensureSlash(path, needsRightSlash = true, needsLeftSlash = null) {
    let result = path;

    if (typeof needsRightSlash === 'boolean') {
        result = trimCharsRight(result, '/');
        if (needsRightSlash) {
            result = `${result}/`;
        }
    }

    if (typeof needsLeftSlash === 'boolean') {
        result = trimCharsLeft(result, '/');
        if (needsLeftSlash) {
            result = `/${result}`;
        }
    }

    return result;
}

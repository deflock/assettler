import {createHash} from 'crypto';

/**
 * @param {string} type
 * @param {string} content
 * @param {string} digest
 * @returns {string}
 */
export function hash(type, content, digest = 'hex') {
    const hasher = createHash(type);
    return hasher.update(content).digest(digest);
}

/**
 * @param {string} content
 * @param {string} digest
 * @returns {string}
 */
export function sha1(content, digest = 'hex') {
    return hash('sha1', content, digest);
}

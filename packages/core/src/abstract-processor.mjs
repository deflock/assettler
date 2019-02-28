/**
 *
 */
export default class AbstractProcessor {
    /**
     * File object:
     *   path
     *   state
     *
     * @param {Object|Array} files
     * @param {Object} params
     */
    async process(files, params) {
        throw new Error('Method "process()" is not implemented');
    }

    /**
     * @param {string} option
     * @returns {boolean}
     */
    hasOption(option) {
        throw new Error('Method "hasOption()" is not implemented');
    }

    /**
     * @param {string} option
     * @returns {*}
     */
    getOption(option) {
        throw new Error('Method "getOption()" is not implemented');
    }
}

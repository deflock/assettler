import nodepath from 'path';
import {writeAsJson} from '@assettler/utils/fs';

/**
 *
 */
export default class Builder {
    /**
     * @param {string} env
     * @param {Object} options
     */
    constructor(env, options = {}) {
        this.env = env;
        this.options = options;

        this.processors = this.createProcessors();
    }

    /**
     * @return {Array}
     */
    createProcessors() {
        return [];
    }

    /**
     * @return {Promise<void>}
     */
    async writeProcessorsMaps() {
        for (const processor of this.processors) {
            // eslint-disable-next-line no-await-in-loop
            await this.writeProcessorMaps(processor);
        }
    }

    /**
     * @param {Object} processor
     * @returns {Promise.<void>}
     */
    async writeProcessorMaps(processor) {
        if (!processor.getMaps) {
            return;
        }

        const maps = processor.getMaps();

        for (const name of Object.keys(maps)) {
            writeAsJson(nodepath.resolve(this.options.mapsDir || '', name), maps[name]);
        }
    }
}

/**
 * @param {Array} events
 * @returns {Array}
 */
export function latestFilesEvents(events) {
    const latestEvents = [];
    const tracked = {};

    for (let i = events.length - 1; i >= 0; i--) {
        const ev = events[i];

        if (Object.prototype.hasOwnProperty.call(tracked, ev.path)) {
            continue;
        }

        tracked[ev.path] = true;
        latestEvents.push(ev);
    }

    return latestEvents.reverse();
}

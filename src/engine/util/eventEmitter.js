class EventEmitter {
    constructor() {
        this._listeners = {};
    }

    /**
     * Subscribe to an event
     * @param {string} event
     * @param {Function} callback
     * @returns {EventEmitter}
     */
    on(event, callback) {
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(callback);
        return this;
    }

    /**
     * Subscribe once — auto-removes after first trigger
     * @param {string} event
     * @param {Function} callback
     * @returns {EventEmitter}
     */
    once(event, callback) {
        var self = this;
        function wrapper() {
            callback.apply(null, arguments);
            self.off(event, wrapper);
        }
        return this.on(event, wrapper);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event
     * @param {Function} callback
     * @returns {EventEmitter}
     */
    off(event, callback) {
        if (!this._listeners[event]) return this;
        this._listeners[event] = this._listeners[event].filter(function(fn) {
            return fn !== callback;
        });
        return this;
    }

    /**
     * Emit an event
     * @param {string} event
     * @param {...*} args
     */
    emit(event) {
        if (!this._listeners[event]) return;
        var args = Array.prototype.slice.call(arguments, 1);
        var listeners = this._listeners[event].slice();
        for (var i = 0; i < listeners.length; i++) {
            listeners[i].apply(null, args);
        }
    }

    /**
     * Remove all listeners for an event (or all events)
     * @param {string} event
     */
    removeAll(event) {
        if (event) {
            delete this._listeners[event];
        } else {
            this._listeners = {};
        }
    }
}

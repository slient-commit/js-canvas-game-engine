class AssetManager {
    constructor() {
        this._images = {};
        this._sounds = {};
        this._loaded = 0;
        this._total = 0;
        this._onProgress = null;
        this._onComplete = null;
        this._loading = false;
        this._queue = [];
    }

    /**
     * Queue an image to load
     * @param {string} key - unique identifier
     * @param {string} path - image file path
     * @returns {AssetManager}
     */
    loadImage(key, path) {
        this._queue.push({ type: 'image', key: key, path: path });
        return this;
    }

    /**
     * Queue a sound to load
     * @param {string} key - unique identifier
     * @param {string} path - audio file path
     * @returns {AssetManager}
     */
    loadSound(key, path) {
        this._queue.push({ type: 'sound', key: key, path: path });
        return this;
    }

    /**
     * Set progress callback
     * @param {Function} fn - called with (loaded, total)
     * @returns {AssetManager}
     */
    onProgress(fn) {
        this._onProgress = fn;
        return this;
    }

    /**
     * Set completion callback
     * @param {Function} fn - called when all assets loaded
     * @returns {AssetManager}
     */
    onComplete(fn) {
        this._onComplete = fn;
        return this;
    }

    /**
     * Start loading all queued assets
     */
    startLoading() {
        if (this._loading) return;
        this._loading = true;
        this._total = this._queue.length;
        this._loaded = 0;

        if (this._total === 0) {
            this._loading = false;
            if (this._onComplete) this._onComplete();
            return;
        }

        var self = this;
        for (var i = 0; i < this._queue.length; i++) {
            var item = this._queue[i];
            if (item.type === 'image') {
                this._loadImageAsset(item.key, item.path);
            } else if (item.type === 'sound') {
                this._loadSoundAsset(item.key, item.path);
            }
        }
    }

    /** @private */
    _loadImageAsset(key, path) {
        var self = this;
        var img = new Image();
        img.onload = function() {
            self._images[key] = img;
            self._assetLoaded();
        };
        img.onerror = function() {
            console.error('AssetManager: failed to load image "' + key + '" from ' + path);
            self._assetLoaded();
        };
        img.src = path;
    }

    /** @private */
    _loadSoundAsset(key, path) {
        var self = this;
        var audio = new Audio();
        audio.oncanplaythrough = function() {
            self._sounds[key] = audio;
            self._assetLoaded();
            audio.oncanplaythrough = null;
        };
        audio.onerror = function() {
            console.error('AssetManager: failed to load sound "' + key + '" from ' + path);
            self._assetLoaded();
        };
        audio.src = path;
    }

    /** @private */
    _assetLoaded() {
        this._loaded++;
        if (this._onProgress) this._onProgress(this._loaded, this._total);
        if (this._loaded >= this._total) {
            this._loading = false;
            this._queue = [];
            if (this._onComplete) this._onComplete();
        }
    }

    /**
     * Get a loaded image
     * @param {string} key
     * @returns {Image|null}
     */
    getImage(key) {
        return this._images[key] || null;
    }

    /**
     * Get a loaded sound
     * @param {string} key
     * @returns {HTMLAudioElement|null}
     */
    getSound(key) {
        return this._sounds[key] || null;
    }

    /**
     * Check if all assets are loaded
     * @returns {boolean}
     */
    isComplete() {
        return !this._loading && this._loaded >= this._total;
    }

    /**
     * Get loading progress (0 to 1)
     * @returns {number}
     */
    progress() {
        if (this._total === 0) return 1;
        return this._loaded / this._total;
    }
}

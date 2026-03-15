class Sound {
    /**
     * Sound Object
     * @param {String} path 
     * @param {Int} volume 
     * @param {Boolean} loop 
     */
    constructor(path, volume = 100, loop = false) {
        this.filePath = path;
        this.loop = loop;
        this.volume = volume / 100;

        this.audioObject = new Audio(this.filePath);
        this.audioObject.loop = this.loop;
        this.audioObject.volume = this.volume;
        this.played = false;
    }

    /**
     * Ending event
     * @param {Function} callback 
     */
    ending(callback = null) {
        if (callback) {
            this.audioObject.onended = callback;
        }
    }

    /**
     * While playing Event
     * @param {Function} callback
     */
    playing(callback = null) {
        if (callback) {
            this.audioObject.onplaying = callback;
        }
    }

    /**
     * After the file is loaded
     * @param {Function} callback
     */
    loaded(callback = null) {
        if (callback) {
            this.audioObject.oncanplaythrough = callback;
        }
    }

    /**
     * Audio duration
     * @returns {Float}
     */
    duration() {
        return this.audioObject.duration;
    }

    /**
     * Mute the audio
     */
    mute() {
        this.audioObject.muted = true;
    }

    /**
     * unmute the audio
     */
    unMute() {
        this.audioObject.muted = false;
    }

    /**
     * Current audio played time
     * @returns {Float}
     */
    currentTime() {
        return this.audioObject.currentTime;
    }

    /**
     * Set current time
     * @param {Float} time 
     */
    setTime(time) {
        this.audioObject.currentTime = time;
    }

    /**
     * Pause the audio
     */
    pause() {
        if (!this.audioObject.paused) {
            this.audioObject.pause();
            this.played = false;
        }
    }

    /**
     * Play the audio
     */
    play() {
        this.played = true;
        this.audioObject.play();
    }

    /**
     * Stop the audio
     */
    stop() {
        this.audioObject.pause();
        this.audioObject.currentTime = 0;
        this.played = false;
    }

}
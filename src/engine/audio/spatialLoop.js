// SpatialLoop — a looping sound tied to a world position
// Volume is automatically adjusted based on distance from camera
class SpatialLoop {
    /**
     * @param {string} path - audio file path
     * @param {number} [baseVolume=0.3] - max volume when closest (0-1)
     */
    constructor(path, baseVolume) {
        this.sound = new Sound(path, 100, true); // Sound at full, we control volume ourselves
        this.sound.audioObject.volume = 0;       // start silent
        this.baseVolume = (baseVolume !== undefined) ? baseVolume : 0.3;
        this.worldX = 0;
        this.worldY = 0;
        this.playing = false;
        this.targetVolume = 0;
    }

    /** Start the loop (if not already playing) */
    start() {
        if (!this.playing) {
            this.sound.audioObject.volume = 0;
            this.sound.play();
            this.playing = true;
        }
    }

    /** Stop the loop */
    stop() {
        if (this.playing) {
            this.sound.stop();
            this.playing = false;
        }
    }

    /** Update world position */
    setPosition(x, y) {
        this.worldX = x;
        this.worldY = y;
    }

    /**
     * Update volume based on distance from camera (call each frame).
     * Smoothly lerps to avoid audio clicks.
     * @param {Camera} camera
     * @param {SoundManager} soundMgr
     * @param {number} maxDistance - max audible distance in world pixels
     * @param {number} dt - delta time
     */
    updateVolume(camera, soundMgr, maxDistance, dt) {
        if (soundMgr.muted) {
            this.targetVolume = 0;
        } else {
            // getSpatialVolume returns 0-1, multiply by baseVolume to cap max loudness
            this.targetVolume = soundMgr.getSpatialVolume(this.worldX, this.worldY, camera, maxDistance) * this.baseVolume;
        }

        var current = this.sound.audioObject.volume;
        var diff = this.targetVolume - current;
        this.sound.audioObject.volume = Math.max(0, Math.min(1, current + diff * Math.min(1, dt * 5)));
    }

    /** Check if the loop has faded to silence */
    isSilent() {
        return this.sound.audioObject.volume < 0.005;
    }
}

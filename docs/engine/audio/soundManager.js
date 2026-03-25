class SoundManager {
    constructor() {
        this.masterVolume = 1.0;
        this.musicVolume = 1.0;
        this.sfxVolume = 1.0;
        this.muted = false;
        this._currentMusic = null;
    }

    /**
     * Set master volume (0.0 - 1.0)
     * @param {number} volume
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Set music volume (0.0 - 1.0)
     * @param {number} volume
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this._currentMusic) {
            this._currentMusic.audioObject.volume = this.masterVolume * this.musicVolume;
        }
    }

    /**
     * Set SFX volume (0.0 - 1.0)
     * @param {number} volume
     */
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Play background music (stops current music)
     * @param {Sound} sound
     */
    playMusic(sound) {
        if (this._currentMusic) {
            this._currentMusic.stop();
        }
        this._currentMusic = sound;
        sound.audioObject.volume = this.muted ? 0 : this.masterVolume * this.musicVolume;
        sound.audioObject.loop = true;
        sound.play();
    }

    /**
     * Play a sound effect
     * @param {Sound} sound
     */
    playSFX(sound) {
        sound.audioObject.volume = this.muted ? 0 : this.masterVolume * this.sfxVolume;
        sound.play();
    }

    /**
     * Play a sound effect with spatial volume based on distance from camera.
     * Sounds far from the camera center are quieter; zoom affects perceived distance.
     * @param {Sound} sound
     * @param {number} worldX - sound source world X
     * @param {number} worldY - sound source world Y
     * @param {Camera} camera - must have location, cameraSize, getZoom()
     * @param {number} [maxDistance=500] - max audible distance in world pixels
     * @returns {boolean} true if sound was played (within range)
     */
    playSpatialSFX(sound, worldX, worldY, camera, maxDistance) {
        if (this.muted) return false;
        if (!camera || !camera.location) {
            this.playSFX(sound);
            return true;
        }
        maxDistance = maxDistance || 500;

        var dx = worldX - camera.location.X;
        var dy = worldY - camera.location.Y;
        var dist = Math.sqrt(dx * dx + dy * dy);

        // Zoom makes things feel closer (zoomed in = louder)
        var zoom = (typeof camera.getZoom === 'function') ? camera.getZoom() : 1;
        var effectiveDist = dist / zoom;

        if (effectiveDist > maxDistance) return false;

        var volume = 1 - (effectiveDist / maxDistance);
        volume = volume * volume; // quadratic falloff for natural sound
        volume *= this.masterVolume * this.sfxVolume;
        volume = Math.max(0, Math.min(1, volume));

        sound.audioObject.volume = volume;
        sound.play();
        return true;
    }

    /**
     * Compute spatial volume for a world position relative to camera.
     * Returns 0 if out of range, 0-1 otherwise.
     * @param {number} worldX
     * @param {number} worldY
     * @param {Camera} camera
     * @param {number} [maxDistance=500]
     * @returns {number} volume 0-1
     */
    getSpatialVolume(worldX, worldY, camera, maxDistance) {
        if (!camera || !camera.location) return this.masterVolume * this.sfxVolume;
        maxDistance = maxDistance || 500;
        var dx = worldX - camera.location.X;
        var dy = worldY - camera.location.Y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var zoom = (typeof camera.getZoom === 'function') ? camera.getZoom() : 1;
        var effectiveDist = dist / zoom;
        if (effectiveDist > maxDistance) return 0;
        var vol = 1 - (effectiveDist / maxDistance);
        return vol * vol * this.masterVolume * this.sfxVolume;
    }

    /**
     * Stop current music
     */
    stopMusic() {
        if (this._currentMusic) {
            this._currentMusic.stop();
            this._currentMusic = null;
        }
    }

    /**
     * Mute all audio
     */
    muteAll() {
        this.muted = true;
        if (this._currentMusic) {
            this._currentMusic.mute();
        }
    }

    /**
     * Unmute all audio
     */
    unmuteAll() {
        this.muted = false;
        if (this._currentMusic) {
            this._currentMusic.unMute();
            this._currentMusic.audioObject.volume = this.masterVolume * this.musicVolume;
        }
    }
}

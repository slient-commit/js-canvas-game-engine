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

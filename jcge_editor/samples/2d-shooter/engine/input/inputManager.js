class InputManager {
    constructor(canvas) {
        this.canvas = canvas;

        // Keyboard state
        this._keysDown = new Set();
        this._keysPressed = new Set();
        this._keysReleased = new Set();

        // Mouse state
        this._mouseDown = new Set();
        this._mousePressed = new Set();
        this._mouseReleased = new Set();
        this._mousePosition = new Vec2(0, 0);

        // Touch state
        this._touches = [];
        this._touchActive = false;

        // Gamepad
        this._gamepads = {};

        // Editor input interception
        this._mouseConsumed = false;
        this._keyboardConsumed = false;

        // Prevent right-click context menu on canvas
        this.canvas.addEventListener('contextmenu', function(e) { e.preventDefault(); });

        // Keyboard
        window.addEventListener('keydown', function(e) {
            if (!this._keysDown.has(e.code)) {
                this._keysPressed.add(e.code);
            }
            this._keysDown.add(e.code);
        }.bind(this));

        window.addEventListener('keyup', function(e) {
            this._keysDown.delete(e.code);
            this._keysReleased.add(e.code);
        }.bind(this));

        // Mouse
        this.canvas.addEventListener('mousemove', function(e) {
            var rect = this.canvas.getBoundingClientRect();
            this._mousePosition = new Vec2(e.clientX - rect.left, e.clientY - rect.top);
        }.bind(this));

        this.canvas.addEventListener('mousedown', function(e) {
            if (!this._mouseDown.has(e.button)) {
                this._mousePressed.add(e.button);
            }
            this._mouseDown.add(e.button);
        }.bind(this));

        this.canvas.addEventListener('mouseup', function(e) {
            this._mouseDown.delete(e.button);
            this._mouseReleased.add(e.button);
        }.bind(this));

        // Touch → mouse mapping
        this.canvas.addEventListener('touchstart', function(e) {
            e.preventDefault();
            this._touchActive = true;
            var touch = e.touches[0];
            var rect = this.canvas.getBoundingClientRect();
            this._mousePosition = new Vec2(touch.clientX - rect.left, touch.clientY - rect.top);
            if (!this._mouseDown.has(0)) {
                this._mousePressed.add(0);
            }
            this._mouseDown.add(0);
        }.bind(this), { passive: false });

        this.canvas.addEventListener('touchmove', function(e) {
            e.preventDefault();
            var touch = e.touches[0];
            var rect = this.canvas.getBoundingClientRect();
            this._mousePosition = new Vec2(touch.clientX - rect.left, touch.clientY - rect.top);
        }.bind(this), { passive: false });

        this.canvas.addEventListener('touchend', function(e) {
            e.preventDefault();
            this._touchActive = false;
            this._mouseDown.delete(0);
            this._mouseReleased.add(0);
        }.bind(this), { passive: false });
    }

    /**
     * Call at end of each frame to clear per-frame state
     */
    update() {
        this._keysPressed.clear();
        this._keysReleased.clear();
        this._mousePressed.clear();
        this._mouseReleased.clear();

        // Poll gamepads
        var gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (var i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) this._gamepads[i] = gamepads[i];
        }

        // Reset consumed flags for next frame
        this._mouseConsumed = false;
        this._keyboardConsumed = false;
    }

    // --- Input Consumption (for editor) ---

    /** Mark mouse input as consumed for this frame */
    consumeMouse() { this._mouseConsumed = true; }

    /** Mark keyboard input as consumed for this frame */
    consumeKeyboard() { this._keyboardConsumed = true; }

    /** Check if mouse input has been consumed this frame */
    isMouseConsumed() { return this._mouseConsumed; }

    /** Check if keyboard input has been consumed this frame */
    isKeyboardConsumed() { return this._keyboardConsumed; }

    // --- Raw input (ignores consumed state, for editor use) ---

    getRawKeyDown(key) { return this._keysDown.has(key); }
    getRawKeyPressed(key) { return this._keysPressed.has(key); }
    getRawKeyReleased(key) { return this._keysReleased.has(key); }
    getRawMouseDown(button) { return this._mouseDown.has(button !== undefined ? button : 0); }
    getRawMousePressed(button) { return this._mousePressed.has(button !== undefined ? button : 0); }
    getRawMouseReleased(button) { return this._mouseReleased.has(button !== undefined ? button : 0); }

    // --- Keyboard (respects consumed state) ---

    /** Key is currently held down */
    isKeyDown(key) {
        if (this._keyboardConsumed) return false;
        return this._keysDown.has(key);
    }

    /** Key was pressed this frame */
    isKeyPressed(key) {
        if (this._keyboardConsumed) return false;
        return this._keysPressed.has(key);
    }

    /** Key was released this frame */
    isKeyReleased(key) {
        if (this._keyboardConsumed) return false;
        return this._keysReleased.has(key);
    }

    // --- Mouse (respects consumed state) ---

    /** Mouse button held down (0=left, 1=middle, 2=right) */
    isMouseDown(button) {
        if (this._mouseConsumed) return false;
        return this._mouseDown.has(button !== undefined ? button : 0);
    }

    /** Mouse button pressed this frame */
    isMousePressed(button) {
        if (this._mouseConsumed) return false;
        return this._mousePressed.has(button !== undefined ? button : 0);
    }

    /** Mouse button released this frame */
    isMouseReleased(button) {
        if (this._mouseConsumed) return false;
        return this._mouseReleased.has(button !== undefined ? button : 0);
    }

    /** Get mouse position relative to canvas (always available, never consumed) */
    getMousePosition() { return this._mousePosition; }

    // --- Touch ---

    /** Is there an active touch */
    isTouchActive() { return this._touchActive; }

    // --- Gamepad ---

    /** Get gamepad by index */
    getGamepad(index) { return this._gamepads[index || 0] || null; }

    /** Check if gamepad button is pressed */
    isGamepadButtonDown(buttonIndex, padIndex) {
        var pad = this.getGamepad(padIndex);
        if (!pad || !pad.buttons[buttonIndex]) return false;
        return pad.buttons[buttonIndex].pressed;
    }

    /** Get gamepad axis value (-1 to 1) */
    getGamepadAxis(axisIndex, padIndex) {
        var pad = this.getGamepad(padIndex);
        if (!pad || pad.axes[axisIndex] === undefined) return 0;
        return pad.axes[axisIndex];
    }
}

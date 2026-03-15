import React, { useState, useRef, useCallback } from 'react';
import { useProject, useProjectDispatch, getSelectedScene } from '../store/ProjectContext';
import CodeEditor from './CodeEditor';

const SNIPPETS = [
  {
    label: 'Arrow keys move',
    code: `var speed = 200;
var obj = this.findByName('OBJECT_NAME');
if (engine.input.isKeyDown(Keys.ArrowLeft)) obj.position.X -= speed * elapsedTime;
if (engine.input.isKeyDown(Keys.ArrowRight)) obj.position.X += speed * elapsedTime;
if (engine.input.isKeyDown(Keys.ArrowUp)) obj.position.Y -= speed * elapsedTime;
if (engine.input.isKeyDown(Keys.ArrowDown)) obj.position.Y += speed * elapsedTime;`
  },
  {
    label: 'WASD move',
    code: `var speed = 200;
var obj = this.findByName('OBJECT_NAME');
if (engine.input.isKeyDown(Keys.A)) obj.position.X -= speed * elapsedTime;
if (engine.input.isKeyDown(Keys.D)) obj.position.X += speed * elapsedTime;
if (engine.input.isKeyDown(Keys.W)) obj.position.Y -= speed * elapsedTime;
if (engine.input.isKeyDown(Keys.S)) obj.position.Y += speed * elapsedTime;`
  },
  {
    label: 'Collision check',
    code: `var a = this.findByName('OBJECT_A');
var b = this.findByName('OBJECT_B');
if (a.collisionWith(b)) {
  // handle collision
}`
  },
  {
    label: 'Boundary clamp',
    code: `var obj = this.findByName('OBJECT_NAME');
var w = engine.canvas.width;
var h = engine.canvas.height;
obj.position.X = Math.max(0, Math.min(w - obj.sprite.width, obj.position.X));
obj.position.Y = Math.max(0, Math.min(h - obj.sprite.height, obj.position.Y));`
  },
  {
    label: 'Hide/show',
    code: `var obj = this.findByName('OBJECT_NAME');
if (engine.input.isKeyPressed(Keys.Space)) {
  obj.showIt = !obj.showIt;
}`
  },
  {
    label: 'Play SFX',
    code: `var sfx = new Sound('assets/audio/FILENAME.mp3', 80);
sfx.play();`
  },
  {
    label: 'Play music',
    code: `if (!this.bgMusic) {
  this.bgMusic = new Sound('assets/audio/FILENAME.mp3', 50, true);
  engine.sound.playMusic(this.bgMusic);
}`
  },
  {
    label: 'Stop music',
    code: `engine.sound.stopMusic();`
  },
  {
    label: 'Console log',
    code: `game.log('value:', someVariable);`
  }
];

const PLACEHOLDERS = {
  onUpdate: `// Called every frame. Use elapsedTime for smooth movement.
// Available: this.findByName('Name'), engine.input, engine.sound, Sound, Collision
// Debug: game.log('value', object) — outputs to the Console panel
//
// Example:
// var player = this.findByName('Player');
// if (engine.input.isKeyDown(Keys.ArrowRight))
//   player.position.X += 200 * elapsedTime;`,
  onCreate: `// Called once when the scene starts.
// Use for initialization logic beyond visual setup.`,
  onDestroy: `// Called when the scene is destroyed.
// Use for cleanup logic.`
};

export default function ScriptEditor({ scriptError }) {
  const state = useProject();
  const dispatch = useProjectDispatch();
  const [activeHook, setActiveHook] = useState('onUpdate');
  const editorRef = useRef(null);

  const scene = getSelectedScene(state);

  const insertAtCursor = useCallback((text) => {
    const editor = editorRef.current;
    if (!editor || !editor.view || !scene) return;
    const view = editor.view;
    view.dispatch(view.state.replaceSelection(text));
    view.focus();
  }, [scene]);

  if (!scene) {
    return <div className="empty-state" style={{ padding: 12 }}>Select a scene to edit scripts</div>;
  }

  const script = scene.script || { onUpdate: '', onCreate: '', onDestroy: '' };
  const code = script[activeHook] || '';

  const handleChange = useCallback((newCode) => {
    if (!scene) return;
    dispatch({
      type: 'UPDATE_SCENE_SCRIPT',
      sceneId: scene.id,
      script: { [activeHook]: newCode }
    });
  }, [scene, activeHook, dispatch]);

  // Collect object names
  const objects = [];
  for (const layer of scene.layers) {
    for (const go of layer.gameObjects) {
      objects.push({ name: go.name, type: 'GO', layer: layer.name });
    }
    for (const el of layer.elements) {
      objects.push({ name: el.name || el.id, type: 'El', layer: layer.name });
    }
  }

  const audioAssets = state.project && state.project.assets ? (state.project.assets.audio || []) : [];

  return (
    <div className="script-editor">
      <div className="script-toolbar">
        <span className="script-scene-name">{scene.name}</span>
        <div className="script-hook-tabs">
          {['onUpdate', 'onCreate', 'onDestroy'].map(hook => (
            <button
              key={hook}
              className={'btn btn-sm' + (activeHook === hook ? ' btn-accent' : '')}
              onClick={() => setActiveHook(hook)}
            >
              {hook}
            </button>
          ))}
        </div>
      </div>
      {scriptError && (
        <div className="script-error-bar">
          Error: {scriptError}
        </div>
      )}
      <div className="script-body">
        <CodeEditor
          ref={editorRef}
          value={code}
          onChange={handleChange}
          placeholder={PLACEHOLDERS[activeHook]}
        />
        <div className="script-helpers">
          <div className="script-helpers-title">Objects</div>
          {objects.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>No objects in scene</div>
          )}
          {objects.map((obj, i) => (
            <button
              key={i}
              className="script-obj-btn"
              title={'Insert this.findByName(\'' + obj.name + '\')'}
              onClick={() => insertAtCursor("this.findByName('" + obj.name + "')")}
            >
              <span className="script-obj-type">{obj.type}</span>
              {obj.name}
            </button>
          ))}
          {audioAssets.length > 0 && (
            <>
              <div className="script-helpers-title" style={{ marginTop: 8 }}>Audio</div>
              {audioAssets.map((a, i) => (
                <button
                  key={i}
                  className="script-obj-btn"
                  title={"Insert new Sound('assets/audio/" + a.filename + "', 80)"}
                  onClick={() => insertAtCursor("new Sound('assets/audio/" + a.filename + "', 80)")}
                >
                  <span className="script-obj-type" style={{ background: 'var(--accent)' }}>&#9835;</span>
                  {a.filename}
                </button>
              ))}
            </>
          )}
          <div className="script-helpers-title" style={{ marginTop: 8 }}>Snippets</div>
          {SNIPPETS.map((s, i) => (
            <button
              key={i}
              className="script-snippet-btn"
              onClick={() => insertAtCursor(s.code)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

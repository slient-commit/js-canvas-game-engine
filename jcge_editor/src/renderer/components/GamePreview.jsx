import React, { useRef, useEffect, useState } from 'react';
import { useProject, useProjectDispatch, getSelectedScene } from '../store/ProjectContext';

const RULER_SIZE = 20;

function getProjectDir(filePath) {
  if (!filePath) return null;
  return filePath.replace(/[/\\][^/\\]+$/, '');
}

function Ruler({ axis, length }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;

    if (axis === 'x') {
      canvas.width = length * dpr;
      canvas.height = RULER_SIZE * dpr;
      canvas.style.width = length + 'px';
      canvas.style.height = RULER_SIZE + 'px';
    } else {
      canvas.width = RULER_SIZE * dpr;
      canvas.height = length * dpr;
      canvas.style.width = RULER_SIZE + 'px';
      canvas.style.height = length + 'px';
    }

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = '#181825';
    ctx.fillRect(0, 0, axis === 'x' ? length : RULER_SIZE, axis === 'x' ? RULER_SIZE : length);

    // Ticks and labels
    ctx.fillStyle = '#6c7086';
    ctx.strokeStyle = '#3b3b55';
    ctx.lineWidth = 1;
    ctx.font = '9px monospace';
    ctx.textBaseline = axis === 'x' ? 'top' : 'middle';

    for (var px = 0; px <= length; px += 10) {
      var isMajor = px % 100 === 0;
      var isMedium = px % 50 === 0;
      var tickLen = isMajor ? 12 : isMedium ? 8 : 4;

      ctx.strokeStyle = isMajor ? '#6c7086' : '#3b3b55';
      ctx.beginPath();
      if (axis === 'x') {
        ctx.moveTo(px + 0.5, RULER_SIZE);
        ctx.lineTo(px + 0.5, RULER_SIZE - tickLen);
      } else {
        ctx.moveTo(RULER_SIZE, px + 0.5);
        ctx.lineTo(RULER_SIZE - tickLen, px + 0.5);
      }
      ctx.stroke();

      if (isMajor && px > 0) {
        ctx.fillStyle = '#a6adc8';
        if (axis === 'x') {
          ctx.textAlign = 'center';
          ctx.fillText(String(px), px, 1);
        } else {
          ctx.save();
          ctx.translate(2, px);
          ctx.rotate(-Math.PI / 2);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(String(px), 0, 0);
          ctx.restore();
        }
      }
    }

    // Border line along the edge facing the canvas
    ctx.strokeStyle = '#3b3b55';
    ctx.beginPath();
    if (axis === 'x') {
      ctx.moveTo(0, RULER_SIZE - 0.5);
      ctx.lineTo(length, RULER_SIZE - 0.5);
    } else {
      ctx.moveTo(RULER_SIZE - 0.5, 0);
      ctx.lineTo(RULER_SIZE - 0.5, length);
    }
    ctx.stroke();
  }, [axis, length]);

  return <canvas ref={canvasRef} />;
}

export default function GamePreview() {
  const state = useProject();
  const dispatch = useProjectDispatch();
  const iframeRef = useRef(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [engineReady, setEngineReady] = useState(false);

  // Listen for messages from the iframe
  useEffect(() => {
    function handleMessage(event) {
      const msg = event.data;
      if (!msg || !msg.type) return;

      switch (msg.type) {
        case 'ready':
          console.log('[GamePreview] Engine ready');
          setEngineReady(true);
          break;
        case 'objectClicked':
          dispatch({ type: 'SELECT_OBJECT', id: msg.id, objectType: msg.objectType || 'gameobject' });
          break;
        case 'objectMoved':
          dispatch({ type: 'UPDATE_OBJECT', id: msg.id, properties: { position: msg.position } });
          break;
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [dispatch]);

  // Send init when iframe HTML is loaded and project exists
  useEffect(() => {
    if (!iframeLoaded || !iframeRef.current || !state.project) return;
    const projectDir = getProjectDir(state.project.filePath);
    if (!projectDir) return;

    const enginePath = 'jcge://local/' + projectDir.replace(/\\/g, '/') + '/engine';
    console.log('[GamePreview] Sending init with enginePath:', enginePath);

    iframeRef.current.contentWindow.postMessage({
      type: 'init',
      enginePath,
      canvasWidth: state.project.settings.canvasWidth,
      canvasHeight: state.project.settings.canvasHeight
    }, '*');
  }, [iframeLoaded, state.project?.filePath]);

  // Send scene data to iframe when engine is ready and scene changes
  useEffect(() => {
    if (!engineReady || !iframeRef.current || !state.project) return;
    const scene = getSelectedScene(state);
    if (scene) {
      iframeRef.current.contentWindow.postMessage({
        type: 'loadScene',
        sceneData: scene
      }, '*');
    }
  }, [engineReady, state.selectedSceneId, state.project]);

  const handleIframeLoad = () => {
    console.log('[GamePreview] Iframe loaded');
    setIframeLoaded(true);
  };

  if (!state.project) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: 24, marginBottom: 8 }}>JCGE Editor</div>
        <div>Create or open a project to get started</div>
      </div>
    );
  }

  const { canvasWidth, canvasHeight } = state.project.settings;

  return (
    <div className="preview-with-rulers">
      <div className="ruler-corner" />
      <div className="ruler ruler-x">
        <Ruler axis="x" length={canvasWidth} />
      </div>
      <div className="ruler ruler-y">
        <Ruler axis="y" length={canvasHeight} />
      </div>
      <iframe
        ref={iframeRef}
        className="game-preview-iframe"
        src="preview/preview.html"
        width={canvasWidth}
        height={canvasHeight}
        title="Game Preview"
        onLoad={handleIframeLoad}
      />
    </div>
  );
}

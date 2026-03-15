import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { EditorView, keymap, placeholder as cmPlaceholder } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';

// Custom theme overrides to match the editor's color scheme
const editorTheme = EditorView.theme({
  '&': {
    fontSize: '12px',
    height: '100%',
  },
  '.cm-scroller': {
    fontFamily: "var(--font-mono, 'Consolas', monospace)",
    lineHeight: '1.5',
  },
  '.cm-content': {
    caretColor: 'var(--accent, #89b4fa)',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: 'var(--accent, #89b4fa)',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--bg-secondary, #181825)',
    borderRight: '1px solid var(--border, #3b3b55)',
    color: 'var(--text-muted, #6c7086)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--bg-active, #3b3b55)',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'rgba(137, 180, 250, 0.2) !important',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(137, 180, 250, 0.05)',
  },
});

const CodeEditor = forwardRef(function CodeEditor({ value, onChange, placeholder }, ref) {
  const containerRef = useRef(null);
  const viewRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const suppressNextUpdate = useRef(false);

  // Keep callback ref in sync
  onChangeRef.current = onChange;

  // Expose the EditorView for external use (snippet insertion)
  useImperativeHandle(ref, () => ({
    get view() { return viewRef.current; }
  }));

  // Create editor on mount
  useEffect(() => {
    const updateListener = EditorView.updateListener.of(update => {
      if (update.docChanged && !suppressNextUpdate.current) {
        onChangeRef.current(update.state.doc.toString());
      }
      suppressNextUpdate.current = false;
    });

    const extensions = [
      basicSetup,
      javascript(),
      oneDark,
      editorTheme,
      updateListener,
      EditorView.lineWrapping,
    ];

    if (placeholder) {
      extensions.push(cmPlaceholder(placeholder));
    }

    const state = EditorState.create({
      doc: value || '',
      extensions,
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Create once on mount

  // Sync external value changes (e.g., switching hooks)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (currentDoc !== value) {
      suppressNextUpdate.current = true;
      view.dispatch({
        changes: {
          from: 0,
          to: currentDoc.length,
          insert: value || ''
        }
      });
    }
  }, [value]);

  return <div ref={containerRef} className="code-editor-container" />;
});

export default CodeEditor;

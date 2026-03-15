import React, { useRef, useEffect, useState } from 'react';

function formatTime(ts) {
  var d = new Date(ts);
  return String(d.getHours()).padStart(2, '0') + ':' +
    String(d.getMinutes()).padStart(2, '0') + ':' +
    String(d.getSeconds()).padStart(2, '0') + '.' +
    String(d.getMilliseconds()).padStart(3, '0');
}

function ConsoleValue({ value }) {
  if (!value) return <span className="cv-null">undefined</span>;

  switch (value.type) {
    case 'string':
      return <span className="cv-string">{value.value}</span>;
    case 'number':
      return <span className="cv-number">{value.value}</span>;
    case 'boolean':
      return <span className="cv-boolean">{value.value}</span>;
    case 'null':
    case 'undefined':
      return <span className="cv-null">{value.value}</span>;
    case 'function':
      return <span className="cv-function">{value.value}</span>;
    case 'error':
      return <span className="cv-error">{value.value}</span>;
    case 'array':
      return <ConsoleArray items={value.value} length={value.length} />;
    case 'object':
      return <ConsoleObject entries={value.value} />;
    default:
      return <span>{String(value.value)}</span>;
  }
}

function ConsoleArray({ items, length }) {
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <span className="cv-preview" onClick={(e) => { e.stopPropagation(); setExpanded(true); }}>
        Array({length}) [{items.slice(0, 3).map((v, i) => (
          <span key={i}>{i > 0 && ', '}<ConsoleValue value={v} /></span>
        ))}{items.length > 3 && ', ...'}]
      </span>
    );
  }

  return (
    <span className="cv-expanded">
      <span className="cv-toggle" onClick={(e) => { e.stopPropagation(); setExpanded(false); }}>Array({length})</span>
      {' [\n'}
      {items.map((v, i) => (
        <span key={i} className="cv-indent">
          {'  '}<span className="cv-key">{i}</span>: <ConsoleValue value={v} />{i < items.length - 1 && ','}{'\n'}
        </span>
      ))}
      {']'}
    </span>
  );
}

function ConsoleObject({ entries }) {
  const [expanded, setExpanded] = useState(false);
  var keys = Object.keys(entries);

  if (!expanded) {
    return (
      <span className="cv-preview" onClick={(e) => { e.stopPropagation(); setExpanded(true); }}>
        {'{'}{keys.slice(0, 3).map((k, i) => (
          <span key={k}>{i > 0 && ', '}<span className="cv-key">{k}</span>: <ConsoleValue value={entries[k]} /></span>
        ))}{keys.length > 3 && ', ...'}{'}'}
      </span>
    );
  }

  return (
    <span className="cv-expanded">
      <span className="cv-toggle" onClick={(e) => { e.stopPropagation(); setExpanded(false); }}>Object</span>
      {' {\n'}
      {keys.map((k, i) => (
        <span key={k} className="cv-indent">
          {'  '}<span className="cv-key">{k}</span>: <ConsoleValue value={entries[k]} />{i < keys.length - 1 && ','}{'\n'}
        </span>
      ))}
      {'}'}
    </span>
  );
}

export default function ConsolePanel({ entries, onClear }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-header">
        <span>Console ({entries.length})</span>
        <button className="btn btn-sm" onClick={onClear}>Clear</button>
      </div>
      <div ref={scrollRef} className="console-entries">
        {entries.length === 0 ? (
          <div className="console-empty">
            No output yet. Use <code>game.log()</code> or <code>console.log()</code> in your scripts.
          </div>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className={'console-entry console-' + entry.level}>
              <span className="console-time">{formatTime(entry.timestamp)}</span>
              <span className="console-content">
                {entry.args.map((arg, i) => (
                  <span key={i}>
                    {i > 0 && ' '}
                    <ConsoleValue value={arg} />
                  </span>
                ))}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

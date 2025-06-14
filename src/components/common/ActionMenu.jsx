// src/components/common/ActionMenu.jsx

import React, { useRef, useEffect, useState } from 'react';

// items: [{ label: string, action: () => void }]
// children: элемент-триггер (например, кнопка “⋮”)
export default function ActionMenu({ items, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  const toggleMenu = e => {
    e.stopPropagation();
    setOpen(o => !o);
  };

  useEffect(() => {
    const handleClickOutside = e => {
      if (open && ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div
      className="action-menu-container"
      ref={ref}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <div onClick={toggleMenu}>
        {children}
      </div>
      {open && (
        <div
          className="action-menu-dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000
          }}
        >
          {items.map((item, idx) => (
            <button
              key={idx}
              className="action-menu-item"
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer'
              }}
              onClick={() => {
                item.action();
                setOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

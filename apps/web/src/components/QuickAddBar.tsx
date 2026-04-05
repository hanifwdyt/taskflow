import { useState, useRef, useImperativeHandle, forwardRef } from 'react';

interface Props {
  onAdd: (title: string) => void;
}

export interface QuickAddBarRef {
  focus: () => void;
}

const QuickAddBar = forwardRef<QuickAddBarRef, Props>(({ onAdd }, ref) => {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  const handleSubmit = () => {
    if (!value.trim()) return;
    onAdd(value.trim());
    setValue('');
  };

  return (
    <div className={`flex items-center gap-2.5 rounded-[10px] bg-[#1e1e23] border px-3.5 py-2.5 transition-colors ${
      focused ? 'border-accent/25' : 'border-[#2a2a30]'
    }`}>
      <span className="text-[#4a4a58] text-[13px]">+</span>
      <input
        ref={inputRef}
        type="text"
        placeholder="New task..."
        value={value}
        onChange={e => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={e => {
          if (e.key === 'Enter') handleSubmit();
          if (e.key === 'Escape') { setValue(''); inputRef.current?.blur(); }
        }}
        className="flex-1 bg-transparent text-[13px] text-[#e0e0e5] placeholder-[#4a4a58] outline-none"
      />
      {value.trim() && (
        <kbd className="text-[10px] font-mono text-[#4a4a58] bg-[#16161a] rounded px-1.5 py-0.5">↵</kbd>
      )}
    </div>
  );
});

QuickAddBar.displayName = 'QuickAddBar';
export default QuickAddBar;

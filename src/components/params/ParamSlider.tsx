import { useCallback, useRef } from 'react';

interface ParamSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

export default function ParamSlider({
  label,
  value,
  min,
  max,
  step = 0.01,
  unit = '',
  onChange,
}: ParamSliderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const percentage = ((value - min) / (max - min)) * 100;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseFloat(e.target.value));
    },
    [onChange]
  );

  return (
    <div className="group flex items-center gap-3 h-9">
      <span className="text-xs text-studio-text-dim w-16 shrink-0 truncate">
        {label}
      </span>
      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="param-slider w-full h-1.5 rounded-full appearance-none cursor-pointer bg-studio-border outline-none"
          style={{
            background: `linear-gradient(to right, #00d4ff 0%, #00d4ff ${percentage}%, #2a2a2a ${percentage}%, #2a2a2a 100%)`,
          }}
        />
      </div>
      <span className="font-data text-xs text-studio-accent w-16 text-right tabular-nums shrink-0">
        {typeof value === 'number' ? (Number.isInteger(value) || step >= 1 ? value : value.toFixed(2)) : value}
        {unit}
      </span>
    </div>
  );
}

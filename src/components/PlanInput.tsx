import { useState } from "react";

interface PlanInputProps {
  onVisualize: (rawInput: string) => void;
  error: string | null;
}

const PLACEHOLDER = `Paste the output of:\n\n  EXPLAIN FORMAT=JSON SELECT ...\n\nas JSON here.`;

export function PlanInput({ onVisualize, error }: PlanInputProps) {
  const [value, setValue] = useState("");

  return (
    <div className="plan-input">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={PLACEHOLDER}
        rows={14}
        spellCheck={false}
      />
      <div className="plan-input-actions">
        <button onClick={() => onVisualize(value)}>Visualize</button>
      </div>
      {error && <div className="plan-input-error">{error}</div>}
    </div>
  );
}

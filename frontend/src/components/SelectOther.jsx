import React, { useState } from 'react';

const OTHER = '__other__';

// A dropdown with a final "Other" choice that reveals a text box so users can type their own value.
export default function SelectOther({ value, onChange, options, placeholder, numeric = false, maxLength = 80, otherPlaceholder }) {
  const known = options.includes(value);
  const [forceOther, setForceOther] = useState(false);
  const isOther = forceOther || (!!value && !known);

  const onSelect = (e) => {
    const v = e.target.value;
    if (v === OTHER) { setForceOther(true); if (known) onChange(''); }
    else { setForceOther(false); onChange(v); }
  };
  const onType = (e) => {
    let v = e.target.value;
    if (numeric) v = v.replace(/[^0-9]/g, '');
    onChange(v);
  };

  return (
    <>
      <select value={isOther ? OTHER : (value || '')} onChange={onSelect}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
        <option value={OTHER}>Other (type your own)</option>
      </select>
      {isOther && (
        <input style={{ marginTop: 8 }} value={value || ''} onChange={onType} maxLength={maxLength}
          inputMode={numeric ? 'numeric' : undefined} placeholder={otherPlaceholder || 'Type here'} autoFocus={forceOther} />
      )}
    </>
  );
}

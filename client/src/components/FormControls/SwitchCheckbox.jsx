import React from 'react';

const SwitchCheckbox = ({ label, isChecked, onSwitchChanged}) => (
    <div className="form-check form-switch" onClick={onSwitchChanged}>
        <label className="form-check-label" onClick={onSwitchChanged}>
            <input 
                className="form-check-input" 
                type="checkbox" 
                name={label} 
                checked={isChecked} 
                onChange={onSwitchChanged}
            />
            {label}
        </label>
    </div>
);

export default SwitchCheckbox;
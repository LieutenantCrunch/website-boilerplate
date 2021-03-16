import React from 'react';

const SwitchCheckbox = ({ label, isChecked, onSwitchChanged}) => (
    <div className="form-check form-switch">
        <label className="form-check-label">
            <input 
                className="form-check-input" 
                type="checkbox" 
                name={label} 
                checked={isChecked} 
                onChange={onSwitchChanged}
                style={{cursor: 'pointer'}}
            />
            {label}
        </label>
    </div>
);

export default SwitchCheckbox;
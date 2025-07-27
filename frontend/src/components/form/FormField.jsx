// components/form/FormField.jsx
import React from 'react';

// Estilos consistentes para todas las modales - idéntico a Información Nutricional
const labelStyle = {
  display: 'block',
  margin: '0px 0px 6px 0px',
  padding: 0,
  fontWeight: 500,
  color: '#374151',
  fontSize: '14px'
};

const inputStyle = {
  display: 'block',
  margin: '0px 0px 16px 0px',
  padding: '8px 12px',
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '14px',
  fontFamily: 'inherit'
};

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: '80px',
  fontSize: '14px',
  fontFamily: 'inherit'
};

const containerStyle = {
  margin: 0,
  padding: 0
};

export const FormField = ({ label, children, labelClassName }) => {
  return (
    <div style={containerStyle}>
      <label style={labelStyle} className={labelClassName}>{label}</label>
      {children}
    </div>
  );
};

export const FormInput = ({ type = "text", ...props }) => {
  return (
    <input 
      type={type}
      style={inputStyle}
      {...props}
    />
  );
};

export const FormTextarea = ({ rows = 4, ...props }) => {
  return (
    <textarea 
      rows={rows}
      style={textareaStyle}
      {...props}
    />
  );
};

export const FormSelect = ({ children, ...props }) => {
  return (
    <select 
      style={inputStyle}
      {...props}
    >
      {children}
    </select>
  );
};

export default { FormField, FormInput, FormTextarea, FormSelect };
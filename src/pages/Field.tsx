import { IonInput } from '@ionic/react';

interface FieldProps {
  id: string;
  label: string;
  value: string;
  error?: string;
  type?: 'text' | 'email' | 'password' | 'tel';
  autocomplete?: 'email' | 'current-password' | 'new-password' | 'name' | 'tel';
  placeholder?: string;
  onChange(value: string): void;
}

/** A labelled input whose error is tied to it with aria-describedby (annex H). */
export function Field({ id, label, value, error, type = 'text', autocomplete, placeholder, onChange }: FieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="ia-field">
      <IonInput
        id={id}
        label={label}
        labelPlacement="stacked"
        type={type}
        value={value}
        autocomplete={autocomplete}
        placeholder={placeholder}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? errorId : undefined}
        onIonInput={(e) => onChange(String(e.detail.value ?? ''))}
      />
      {error && <div id={errorId} className="ia-error">{error}</div>}
    </div>
  );
}

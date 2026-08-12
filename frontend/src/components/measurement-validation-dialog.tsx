import type { MeasurementValidationWarning } from '@/lib/measurement-validation';

type MeasurementValidationDialogProps = {
  warning: MeasurementValidationWarning | null;
  onKeepEnteredValue: () => void;
  onUseSuggestedValue: () => void;
  onEditValue: () => void;
};

const format = (value: number, unit: string) => `${value} ${unit}`;

/**
 * A shared confirmation dialog for advisory measurement validation. It never
 * alters a measurement itself; accepting the suggested value is an explicit
 * customer action handled by the containing form.
 */
export function MeasurementValidationDialog({
  warning,
  onKeepEnteredValue,
  onUseSuggestedValue,
  onEditValue,
}: MeasurementValidationDialogProps) {
  if (!warning) return null;

  const entered = format(warning.enteredValue, warning.enteredUnit);
  const interpretedAs = `${warning.enteredValue} ${warning.suggestedInputUnit}`;
  const suggested = format(warning.suggestedValue, warning.suggestedUnit);

  return (
    <div
      role="presentation"
      style={backdropStyle}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onEditValue();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="measurement-validation-title"
        style={dialogStyle}
      >
        <div style={iconStyle} aria-hidden="true">!</div>
        <div style={eyebrowStyle}>Quick measurement check</div>
        <h2 id="measurement-validation-title" style={titleStyle}>Is this value correct?</h2>
        <p style={messageStyle}>{warning.message}</p>
        <p style={helpStyle}>
          Nothing has been changed. You can keep {entered}, use the {interpretedAs} interpretation,
          or edit the value.
        </p>
        <div style={actionsStyle}>
          <button type="button" style={secondaryButtonStyle} onClick={onEditValue}>
            Edit value
          </button>
          <button type="button" style={secondaryButtonStyle} onClick={onKeepEnteredValue}>
            Keep {entered}
          </button>
          <button type="button" style={primaryButtonStyle} onClick={onUseSuggestedValue}>
            Use {interpretedAs} ({suggested})
          </button>
        </div>
      </section>
    </div>
  );
}

const backdropStyle = {
  position: 'fixed' as const,
  inset: 0,
  zIndex: 2000,
  display: 'grid',
  placeItems: 'center',
  padding: 20,
  background: 'rgba(13, 13, 13, 0.55)',
  backdropFilter: 'blur(8px)',
};

const dialogStyle = {
  width: 'min(100%, 520px)',
  borderRadius: 24,
  padding: '32px',
  background: '#FFFFFF',
  boxShadow: '0 28px 70px rgba(0, 0, 0, 0.24)',
  color: '#0D0D0D',
  fontFamily: "'DM Sans', sans-serif",
};

const iconStyle = {
  width: 38,
  height: 38,
  display: 'grid',
  placeItems: 'center',
  marginBottom: 18,
  borderRadius: 12,
  background: '#E8F3E6',
  border: '1px solid #B4D1B0',
  color: '#5C8758',
  fontSize: 21,
  fontWeight: 800,
};

const eyebrowStyle = {
  marginBottom: 8,
  color: '#7A9E78',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
};

const titleStyle = {
  margin: 0,
  fontFamily: "'Cormorant Garamond', serif",
  fontSize: 34,
  lineHeight: 1.05,
};

const messageStyle = {
  margin: '16px 0 8px',
  color: '#333333',
  fontSize: 15,
  lineHeight: 1.6,
};

const helpStyle = {
  margin: 0,
  color: '#757575',
  fontSize: 13,
  lineHeight: 1.55,
};

const actionsStyle = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: 10,
  marginTop: 26,
};

const secondaryButtonStyle = {
  minHeight: 42,
  padding: '0 14px',
  border: '1px solid #D4D4D4',
  borderRadius: 10,
  background: '#FFFFFF',
  color: '#292929',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 700,
};

const primaryButtonStyle = {
  flex: '1 1 100%',
  minHeight: 46,
  padding: '0 16px',
  border: '1px solid #0D0D0D',
  borderRadius: 10,
  background: '#0D0D0D',
  color: '#FFFFFF',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 700,
};

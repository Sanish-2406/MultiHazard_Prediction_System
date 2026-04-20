export default function ConfusionMatrix({ confusion, title }) {
  if (!confusion) return null;
  const { classes, matrix } = confusion;

  // Find max for color scaling
  const allValues = matrix.flat();
  const maxVal = Math.max(...allValues);

  const getCellColor = (value, row, col) => {
    const intensity = maxVal > 0 ? value / maxVal : 0;
    if (row === col) {
      // Diagonal = correct predictions → green
      return `rgba(34, 197, 94, ${0.15 + intensity * 0.55})`;
    }
    // Off-diagonal = errors → red
    return `rgba(239, 68, 68, ${0.05 + intensity * 0.45})`;
  };

  const getTextColor = (value, row, col) => {
    const intensity = maxVal > 0 ? value / maxVal : 0;
    if (row === col) return intensity > 0.4 ? '#bbf7d0' : '#86efac';
    return intensity > 0.3 ? '#fca5a5' : '#f87171';
  };

  return (
    <div className="confusion-matrix" id={`confusion-${title?.replace(/\s/g, '-')}`}>
      {title && <h4 className="confusion-title">{title}</h4>}
      <div className="confusion-labels">
        <span className="confusion-axis-label y-axis">Actual</span>
        <span className="confusion-axis-label x-axis">Predicted</span>
      </div>
      <table className="confusion-table">
        <thead>
          <tr>
            <th></th>
            {classes.map((c) => (
              <th key={c} className="confusion-header">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <td className="confusion-row-label">{classes[i]}</td>
              {row.map((val, j) => (
                <td
                  key={j}
                  className="confusion-cell"
                  style={{
                    background: getCellColor(val, i, j),
                    color: getTextColor(val, i, j),
                  }}
                >
                  {val}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PhaseBadge({ phase }) {
  const label = phase === 'work' ? 'Work' : phase === 'rest' ? 'Rest' : phase === 'circuitRest' ? 'Circuit Rest' : phase === 'complete' ? 'Complete' : 'Ready';
  const color = phase === 'rest' || phase === 'circuitRest' ? 'text-[#d2d8cb]' : 'text-[#d4ff6a]';
  return <p className={`text-xs font-medium uppercase tracking-[0.45em] ${color}`}>{label}</p>;
}

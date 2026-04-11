import { formatClock } from '../../utils/workout';

export default function TimerDisplay({ seconds, urgent }) {
  return (
    <div
      className={`mt-4 text-4xl font-semibold tracking-[-0.06em] transition-colors duration-300 sm:text-6xl ${
        urgent ? 'text-[#ff8b2b]' : 'text-[#f2f5ef]'
      }`}
    >
      {formatClock(seconds)}
    </div>
  );
}

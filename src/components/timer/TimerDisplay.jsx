import { formatClock } from '../../utils/workout';

export default function TimerDisplay({ seconds }) {
  return (
    <div className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-[#f2f5ef] sm:text-6xl">
      {formatClock(seconds)}
    </div>
  );
}

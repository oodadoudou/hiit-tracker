import { formatClock } from '../../utils/workout';

export default function TimerDisplay({ seconds }) {
  return (
    <div className="mt-5 text-6xl font-semibold tracking-[-0.08em] text-[#f2f5ef] sm:text-8xl">
      {formatClock(seconds)}
    </div>
  );
}

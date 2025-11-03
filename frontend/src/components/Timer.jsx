import { useState, useEffect, useRef } from 'react';

function Timer({ duration, onExpire, mode = 'total' }) {
  const [seconds, setSeconds] = useState(duration);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [onExpire]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getColorClass = () => {
    const percentage = seconds / duration;
    if (percentage <= 0.2) return 'text-red-600';
    if (percentage <= 0.5) return 'text-orange-600';
    return 'text-green-600';
  };

  return (
    <div className="flex items-center justify-center mb-4">
      <div className={`text-2xl font-bold ${getColorClass()}`}>
        {mode === 'per-question' ? (
          <span>Question Time: {formatTime(seconds)}</span>
        ) : (
          <span>Time Remaining: {formatTime(seconds)}</span>
        )}
      </div>
    </div>
  );
}

export default Timer;


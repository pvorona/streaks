export function formatTime(totalSeconds: number): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  const totalMinutes = Math.floor(totalSeconds / 60);

  const seconds = totalSeconds % 60;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return { hours, minutes, seconds };
}

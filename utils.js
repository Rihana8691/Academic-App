export function getCountdown(targetDate) {
  if (!targetDate) return null;

  const now = new Date();
  const target = new Date(targetDate);

  // Reset both to midnight for a "Days Remaining" comparison
  const d1 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d2 = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  const diffTime = d2 - d1;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today!';
  if (diffDays < 0) return 'Passed';
  if (diffDays === 1) return 'Tomorrow';

  return `${diffDays} days`;
}

// Countdown for a class happening today, given "HH:MM" start/end time strings.
// Shows the plain scheduled time until within 1 hour of start, then switches
// to a live countdown. Returns "In progress" during the class, "Passed" after.
export function getClassCountdown(startTime, endTime) {
  const now = new Date();
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  const start = new Date();
  start.setHours(startH, startM, 0, 0);

  const end = new Date();
  end.setHours(endH, endM, 0, 0);

  if (now >= start && now <= end) return 'In progress';
  if (now > end) return 'Passed';

  const diffMs = start - now;
  const oneHourMs = 60 * 60 * 1000;

  if (diffMs > oneHourMs) {
    // More than 1 hour away — just show the plain time, no countdown pressure
    return formatTime12Hour(startTime);
  }

  // Within 1 hour — show live countdown
  const mins = Math.floor(diffMs / (1000 * 60));
  return `Starts in ${mins}m`;
}

function formatTime12Hour(time24) {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}
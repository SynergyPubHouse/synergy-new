export const getRevisionDeadlineText = (dueDate, now = new Date()) => {
  if (!dueDate) return "";

  const deadline = new Date(dueDate);
  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs <= 0) {
    return "Revision deadline passed";
  }

  const minuteMs = 1000 * 60;
  const hourMs = minuteMs * 60;
  const totalMinutes = Math.floor(diffMs / minuteMs);

  if (totalMinutes >= 24 * 60) {
    const days = Math.floor(totalMinutes / (24 * 60));
    return `Revision due in ${days} day${days === 1 ? "" : "s"}`;
  }

  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (minutes > 0) {
      return `Revision due in ${hours} hour${hours === 1 ? "" : "s"} ${minutes} minute${minutes === 1 ? "" : "s"}`;
    }

    return `Revision due in ${hours} hour${hours === 1 ? "" : "s"}`;
  }

  if (totalMinutes > 0) {
    return `Revision due in ${totalMinutes} minute${totalMinutes === 1 ? "" : "s"}`;
  }

  return "Revision due in less than 1 minute";
};

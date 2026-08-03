export function safeFormatTime(val: any): string {
  if (!val) return 'Just now';
  try {
    let d: Date;
    if (typeof val?.toDate === 'function') {
      d = val.toDate();
    } else if (typeof val === 'object' && typeof val?.seconds === 'number') {
      d = new Date(val.seconds * 1000);
    } else if (typeof val === 'number') {
      d = new Date(val);
    } else if (typeof val === 'string') {
      const num = Number(val);
      d = isNaN(num) ? new Date(val) : new Date(num);
    } else {
      d = new Date(val);
    }

    if (isNaN(d.getTime())) {
      return 'Just now';
    }

    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (err) {
    return 'Just now';
  }
}

export function safeFormatDate(val: any): string {
  if (!val) return 'Recently';
  try {
    let d: Date;
    if (typeof val?.toDate === 'function') {
      d = val.toDate();
    } else if (typeof val === 'object' && typeof val?.seconds === 'number') {
      d = new Date(val.seconds * 1000);
    } else if (typeof val === 'number') {
      d = new Date(val);
    } else if (typeof val === 'string') {
      const num = Number(val);
      d = isNaN(num) ? new Date(val) : new Date(num);
    } else {
      d = new Date(val);
    }

    if (isNaN(d.getTime())) {
      return 'Recently';
    }

    return d.toLocaleDateString();
  } catch (err) {
    return 'Recently';
  }
}

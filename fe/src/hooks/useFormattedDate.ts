import { useMemo } from 'react';
import dayjs from 'dayjs';

export function useFormattedDate(date: string | Date, format = 'DD MMM YYYY') {
  return useMemo(() => {
    return dayjs(date).format(format);
  }, [date, format]);
}


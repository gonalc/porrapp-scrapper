import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(isSameOrBefore);
dayjs.extend(timezone)
dayjs.extend(utc)

export const UNIDAD_EDITORIAL_FORMAT = 'YYYY-MM-DD';

export const EUROPE_MADRID_TIMEZONE = 'Europe/Madrid';

export default dayjs;

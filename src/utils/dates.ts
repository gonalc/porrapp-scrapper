import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

dayjs.extend(isSameOrBefore);

export const UNIDAD_EDITORIAL_FORMAT = 'YYYY-MM-DD';

export default dayjs;

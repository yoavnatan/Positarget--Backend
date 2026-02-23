// src/types/express.d.ts
import { User } from '../api/user/user.model'

declare global {
    namespace Express {
        interface Request {
            // אנחנו מגדירים את השדה כאופציונלי כי הוא לא קיים בכל בקשה (למשל לפני לוגין)
            loggedinUser?: User | { _id: string; username: string }
        }
    }
}

// חובה להוסיף export ריק כדי ש-TS יתייחס לקובץ כאל Module
export { }
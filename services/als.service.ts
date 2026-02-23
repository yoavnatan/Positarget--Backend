// services/als.service.ts
import { AsyncLocalStorage } from 'node:async_hooks'
import { User } from '../api/user/user.model'

// הגדרת המבנה של הזיכרון הלוקאלי של הבקשה
export interface MyAsyncStore {
    loggedinUser?: User;
    // כאן תוכל להוסיף שדות נוספים בעתיד כמו requestId
}


export const asyncLocalStorage = new AsyncLocalStorage<MyAsyncStore>()
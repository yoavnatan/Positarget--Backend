import { User } from "../user/user.model"
import { ObjectId } from 'mongodb'

export interface Market { // השוק הספציפי בתוך האירוע
    id: string;           // ה-conditionId
    question: string;
    outcomePrices: number[]; // ["0.55", "0.45"]
    outcomes: string[];      // ["Yes", "No"]
    clobTokenIds: string[];
    icons: string[]; // מזהי האייקונים עבור ספורט (אם יש)
}


export interface Event {
    _id?: ObjectId
    title: string;           // הכותרת של האירוע
    description: string;
    imgUrl: string;
    endDate: Date | number;
    status: 'open' | 'closed';
    markets: Market[];       // מערך השווקים שבתוך האירוע
    category: string;        // "Politics", "Crypto" וכו'
    volume: number;
    msgs: Msg[];

}

export type FilterBy = {
    txt: string
    status?: 'open' | 'closed' | 'all'
    sortField: string
    sortDir: 1 | -1
    pageIdx?: number
}

export interface Msg {
    id: string;
    by: User;
    txt: string;
}
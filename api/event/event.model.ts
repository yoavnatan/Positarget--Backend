import { User } from "../user/user.model"
import { ObjectId } from 'mongodb'

export interface Market { // השוק הספציפי בתוך האירוע
    id: string; // ה-conditionId
    eventId?: string;
    question: string;
    outcomePrices: number[]; // ["0.55", "0.45"]
    outcomes: string[];      // ["Yes", "No"]
    clobTokenIds: string[];
    conditionId: string;
    description: string;
}

export interface Event { // זה ה"כרטיס" (Card) שלך
    _id: string;             // ה-Event ID
    title: string;           // הכותרת של האירוע
    description: string;
    createdAt: Date | number;
    imgUrl: string;
    endDate: Date | number;
    status: 'open' | 'closed';
    markets: Market[];       // מערך השווקים שבתוך האירוע
    category: string;        // "Politics", "Crypto" וכו'
    volume: number;
    msgs: Msg[];
    labels: string[]           // מערך ההודעות שקשורות לאירוע
}
export type FilterBy = {
    txt: string
    labels: string[]
    favoritesOnly: boolean
    status?: 'open' | 'closed' | 'all'
    sortField: string
    sortDir: 1 | -1
    pageIdx?: number
}

export interface Msg {
    _id: string;
    by: User;
    txt: string;
    createdAt: number;
    aboutEventId: string;
}


export interface EventComment {
    id: string;
    by: {
        _id: string;
        fullname: string;
        imgUrl?: string;
    };
    txt: string;
    createdAt: number;
}
// המבנה שחוזר מה-API של Polymarket
export interface PolyOrderbookLevel {
    price: string; // ה-API מחזיר מחרוזת
    size: string;  // ה-API מחזיר מחרוזת
}

export interface PolyOrderbookResponse {
    bids: PolyOrderbookLevel[];
    asks: PolyOrderbookLevel[];
    hash: string;
}

// המבנה המנורמל שאנחנו רוצים לעבוד איתו באפליקציה
export interface OrderbookLevel {
    price: number;
    size: number;
    total: number;
}

export interface Orderbook {
    bids: OrderbookLevel[];
    asks: OrderbookLevel[];
}


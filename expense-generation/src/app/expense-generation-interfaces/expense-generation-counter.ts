export interface ExpenseGenerationCounter {
    ownerId: number;
    period: string;
    issueDate: string;
    firstExpirationDate: string;
    secondExpirationDate: string;
    firstExpirationAmount: number;
    amountPayed: number;
    status: string;
    approved: boolean;
    paymentPlatform: string | null;
    paymentMethod: string | null;
    paymentIntentId: string | null;
}

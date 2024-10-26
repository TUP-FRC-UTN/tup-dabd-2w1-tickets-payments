export interface ExpenseGenerationExpenseInterface {
  id: number;
  ownerId: number;
  period: string;
  issueDate: Date;
  status: string;
  first_expiration_date: string;
  first_expiration_amount: number;
  second_expiration_date: string;
  second_expiration_amount: string;
  actual_amount: string;
  amount_payed: string;
  payment_method: string;
  payment_platform: string;
  payment_id: string;
  selected?: boolean;
  paymentDate?: Date;
  //status tipe : Pago, Pendiente, Exceptuado pero el exceptuado no lo uso
}

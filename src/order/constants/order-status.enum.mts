export enum OrderStatus {
  /** The initial state of order status */
  PENDING = "PENDING",
  /** The next state of order status after PENDING or UNFINISHED */
  COOKING = "COOKING",
  /** The final state of order status after COOKING */
  COMPLETED = "COMPLETED",
  /** The next state of order status after COOKING. Used if order cannot be completed due to bot shutdown */
  UNFINISHED = "UNFINISHED",
}

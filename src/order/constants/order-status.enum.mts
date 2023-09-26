export enum OrderStatus {
  /** The initial state of order status */
  PENDING = "PENDING",
  /** The next state of order status after PENDING or UNFINISHED */
  COOKING = "COOKING",
  /** The final state of order status after COOKING */
  FINISHED = "FINISHED",
  /** The next state of order status after COOKING */
  UNFINISHED = "UNFINISHED",
}

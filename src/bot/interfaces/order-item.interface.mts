import { OrderStatus } from "../../order/constants/order-status.enum.mjs";
import { CookingBot } from "../cooking.bot.mjs";

export interface OrderItem {
  orderId: number;
  orderName: string;
  status: OrderStatus;
  cookedBy?: CookingBot;
  orderedAt: Date;
  cookingAt?: Date;
  finishedAt?: Date;
}

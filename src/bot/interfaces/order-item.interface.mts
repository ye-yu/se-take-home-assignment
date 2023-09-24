import { CookingBot } from "../cooking.bot.mjs";

export interface OrderItem {
  orderId: number;
  orderName: string;
  status: "unprepared" | "cooking" | "failed" | "finished";
  cookedBy?: CookingBot;
  orderedAt: Date;
  cookingAt?: Date;
  finishedAt?: Date;
}

import { CookerBot } from "../cooker.bot.mjs";

export interface OrderItem {
  orderId: number;
  orderName: string;
  status: "unprepared" | "cooking" | "failed" | "finished";
  cookedBy?: CookerBot;
  orderedAt: Date;
  cookingAt?: Date;
  finishedAt?: Date;
}

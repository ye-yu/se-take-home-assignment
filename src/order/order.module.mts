import { Module } from "@nestjs/common";
import { BotModule } from "../bot/bot.module.mjs";
import { OrderService } from "./order.service.mjs";

@Module({
  imports: [BotModule],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}

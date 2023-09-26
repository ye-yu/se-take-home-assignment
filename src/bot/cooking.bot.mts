import { Logger } from "@nestjs/common";
import { CookingStatusEventEmitter } from "./interfaces/cooking-status-EE.interface.mjs";
import { OrderItem } from "./interfaces/order-item.interface.mjs";

export class CookingBot {
  isCooking = false; // aka is busy
  order: null | OrderItem;
  cookingDuration = 10;
  logger: Logger;

  constructor(
    readonly cookingStatusEventEmitter: CookingStatusEventEmitter,
    readonly name: string
  ) {
    this.logger = new Logger(`${CookingBot.name + this.name}`);
  }

  cook(order: OrderItem): boolean {
    const { orderId, orderName } = order;
    const orderSummary = `${orderId} - ${orderName}`;
    if (this.isCooking) {
      this.logger.log(`Bot is busy, cannot cook ${orderSummary}.`);
      return false;
    }
    this.isCooking = true;
    this.order = order;
    this.logger.log(`Bot is now cooking ${orderSummary}.`);
    setTimeout(() => {
      this.finished();
    }, this.cookingDuration * 1000);
    return true;
  }

  shutdown() {
    if (this.isCooking) {
      this.cookingStatusEventEmitter.emit("unfinished", this.order!.orderId);
    }
    this.cookingStatusEventEmitter.emit("shutdown", this.name);
  }

  finished() {
    if (!this.order) {
      this.logger.warn(`Order finished is emitted but there is no order item!`);
      return;
    }
    const { orderId, orderName } = this.order;
    const orderSummary = `${orderId} - ${orderName}`;
    this.logger.log(`Bot has finished cooking ${orderSummary}.`);
    this.isCooking = false;
    this.order = null;
    this.cookingStatusEventEmitter.emit("finished", orderId);
    this.cookingStatusEventEmitter.emit("ready");
  }
}

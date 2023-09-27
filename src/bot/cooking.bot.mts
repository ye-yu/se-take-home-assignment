import { Logger } from "@nestjs/common";
import { CookingStatusEventEmitter } from "./interfaces/cooking-status-EE.interface.mjs";
import { OrderItem } from "./interfaces/order-item.interface.mjs";

export class CookingBot {
  isCooking = false; // aka is busy
  order: null | OrderItem;
  cookingDuration = 5;
  currentCookingDuration = 0;
  currentCookingDurationUpdateInterval: NodeJS.Timeout | null = null;
  finishedTimeout: NodeJS.Timeout | null = null;
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

    this.currentCookingDuration = this.cookingDuration;
    this.currentCookingDurationUpdateInterval = setInterval(() => {
      this.currentCookingDuration -= 1;
    }, 1000);

    this.finishedTimeout = setTimeout(() => {
      this.finished();
    }, this.cookingDuration * 1000);
    return true;
  }

  shutdown() {
    if (this.finishedTimeout) {
      clearTimeout(this.finishedTimeout);
      this.finishedTimeout = null;
    }
    this.cookingStatusEventEmitter.emit("shutdown", this.name);
    if (this.isCooking) {
      const { orderId } = this.order!;
      this.isCooking = false;
      this.order = null;
      this.cookingStatusEventEmitter.emit("unfinished", orderId);
    }
  }

  finished() {
    if (!this.order) {
      return;
    }
    const { orderId, orderName } = this.order;
    const orderSummary = `${orderId} - ${orderName}`;
    this.logger.log(`Bot has finished cooking ${orderSummary}.`);
    this.isCooking = false;
    this.order = null;
    this.cookingStatusEventEmitter.emit("finished", orderId);
    this.cookingStatusEventEmitter.emit("ready");

    this.currentCookingDuration = 0;
    if (this.currentCookingDurationUpdateInterval) {
      clearInterval(this.currentCookingDurationUpdateInterval);
      this.currentCookingDurationUpdateInterval = null;
    }
  }
}

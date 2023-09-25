import { Injectable, Logger } from "@nestjs/common";
import { CookingBot } from "./cooking.bot.mjs";
import EventEmitter from "events";
import { CookingStatusEventEmitter } from "./interfaces/cooking-status-EE.interface.mjs";
import { OrderItem } from "./interfaces/order-item.interface.mjs";
import { randomUUID } from "crypto";

@Injectable()
export class BotService {
  cookingBots: Record<string, CookingBot> = {};
  orderHistory = new Array<OrderItem>();
  uncookedOrders: Record<number, OrderItem> = {};
  pendingOrders: Record<number, OrderItem> = {};
  finishedOrders: Record<number, OrderItem> = {};

  eventEmitter: CookingStatusEventEmitter = new EventEmitter();
  logger = new Logger(BotService.name);

  constructor() {
    this.initEventEmitter();
  }

  initEventEmitter() {
    this.eventEmitter.on("finished", (orderId) => {
      const orderItem = this.orderHistory[orderId];
      if (!orderItem) {
        this.logger.warn(
          `Order ID ${orderId} is issued finished but order is not found!`
        );
        return;
      }
      orderItem.status = "finished";
      orderItem.finishedAt = new Date();
      this.finishedOrders[orderId] = orderItem;
      delete this.pendingOrders[orderId];
    });

    this.eventEmitter.on("unfinished", (orderId) => {
      const orderItem = this.orderHistory[orderId];
      if (!orderItem) {
        this.logger.warn(
          `Order ID ${orderId} is issued unfinished but order is not found!`
        );
        return;
      }
      orderItem.status = "failed";
      this.uncookedOrders[orderId] = orderItem;
      delete this.pendingOrders[orderId];
      this.cookNextOrderIfExists();
    });

    this.eventEmitter.on("shutdown", (botId) => {
      const cookingBot = this.cookingBots[botId];
      if (!cookingBot) {
        this.logger.warn(
          `Cooking bot ${botId} is issued shutdown but bot is not found!`
        );
        return;
      }
      delete this.cookingBots[botId];
    });

    this.eventEmitter.on("bootup", () => {
      this.cookNextOrderIfExists();
    });
  }

  installNewBot() {
    const name = randomUUID();
    const cookingBot = new CookingBot(this.eventEmitter, name);
    this.cookingBots[name] = cookingBot;
  }

  shutdownBot(name: string) {
    this.cookingBots[name].shutdown();
  }

  startCooking(orderItem: OrderItem): CookingBot | null {
    const availableBot = Object.values(this.cookingBots).find(
      (e) => !e.isCooking
    );
    if (!availableBot) {
      return null;
    }

    const cookingStarted = availableBot.cook(orderItem);
    if (!cookingStarted) {
      return null;
    }
    return availableBot;
  }

  cookNextOrderIfExists() {
    this.eventEmitter.emit("ready");
  }

  onBotReady(handler: () => void) {
    this.eventEmitter.addListener("ready", handler);
  }
}

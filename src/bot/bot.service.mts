import { Injectable, Logger } from "@nestjs/common";
import { CookingBot } from "./cooking.bot.mjs";
import { default as ee } from "eventemitter2";
import { CookingStatusEventEmitter } from "./interfaces/cooking-status-EE.interface.mjs";
import { OrderItem } from "./interfaces/order-item.interface.mjs";
import { randomUUID } from "crypto";

@Injectable()
export class BotService {
  cookingBots: Record<string, CookingBot> = {};

  eventEmitter: CookingStatusEventEmitter =
    new ee.EventEmitter2() as CookingStatusEventEmitter;
  logger = new Logger(BotService.name);

  constructor() {
    this.initEventEmitter();
  }

  initEventEmitter() {
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
      this.emitBotReady();
    });
  }

  installNewBot() {
    const name = randomUUID();
    const cookingBot = new CookingBot(this.eventEmitter, name);
    this.cookingBots[name] = cookingBot;
    this.logger.log("Booting up bot");
    cookingBot.cookingStatusEventEmitter.emit("bootup", name);
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

  emitBotReady() {
    this.eventEmitter.emit("ready");
  }

  onBotReady(handler: () => void) {
    this.eventEmitter.addListener("ready", handler);
  }

  onBotFinished(handler: (orderId: number) => void) {
    this.eventEmitter.addListener("finished", handler);
  }

  onBotUnfinished(handler: (orderId: number) => void) {
    this.eventEmitter.addListener("unfinished", handler);
  }
}

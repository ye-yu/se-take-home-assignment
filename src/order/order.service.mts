import { Injectable, Logger } from "@nestjs/common";
import { BotService } from "../bot/bot.service.mjs";
import { OrderItem } from "../bot/interfaces/order-item.interface.mjs";
import { CustomerTypeEnum } from "./constants/customer-type.enum.mjs";

@Injectable()
export class OrderService {
  vipOrders: Record<number, OrderItem> = {};
  regularOrders: Record<number, OrderItem> = {};
  orderHistory: Record<number, OrderItem> = {};
  orderSequence = 0;
  logger = new Logger(OrderService.name);
  constructor(readonly botService: BotService) {
    this.botService.onBotReady(() => this.sendOrdersToKitchen());
    this.botService.onBotFinished((orderId) => {
      const orderItem = this.orderHistory[orderId];
      if (!orderItem) {
        this.logger.warn(
          `Order ID ${orderId} is issued finished but order is not found!`
        );
        return;
      }
      orderItem.status = "finished";
      orderItem.finishedAt = new Date();
      delete this.vipOrders[orderId];
      delete this.regularOrders[orderId];
    });
    this.botService.onBotUnfinished((orderId) => {
      const orderItem = this.orderHistory[orderId];
      if (!orderItem) {
        this.logger.warn(
          `Order ID ${orderId} is issued unfinished but order is not found!`
        );
        return;
      }
      orderItem.status = "unprepared";
      this.sendOrdersToKitchen();
    });
  }

  makeNewOrder(orderName: string, customerType: CustomerTypeEnum): OrderItem {
    const orderItem: OrderItem = {
      orderId: ++this.orderSequence,
      orderName,
      status: "unprepared",
      orderedAt: new Date(),
    };
    switch (customerType) {
      case CustomerTypeEnum.VIP: {
        this.vipOrders[orderItem.orderId] = orderItem;
        break;
      }
      case CustomerTypeEnum.REGULAR: {
        this.regularOrders[orderItem.orderId] = orderItem;
        break;
      }
    }
    this.orderHistory[orderItem.orderId] = orderItem;
    this.sendOrdersToKitchen();
    return orderItem;
  }

  sendOrdersToKitchen() {
    const firstUncookedVIPOrder = Object.values(this.vipOrders)[0];
    const firstUncookedRegularOrder = Object.values(this.regularOrders)[0];

    const orderToCook = firstUncookedVIPOrder ?? firstUncookedRegularOrder;
    if (!orderToCook) {
      return;
    }

    const cookingBotFound = this.botService.startCooking(orderToCook);
    if (!cookingBotFound) {
      return;
    }

    orderToCook.cookingAt = new Date();
    orderToCook.status = "cooking";
    orderToCook.cookedBy = cookingBotFound;
  }

  getOrderInfo(orderId: number): OrderItem {
    const orderItem = this.orderHistory[orderId];
    if (!orderItem) {
      throw new Error(`Order ID ${orderId} is not found.`);
    }
    return orderItem;
  }
}

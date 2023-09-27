import { INestApplication } from "@nestjs/common";
import { TestingModule, Test } from "@nestjs/testing";
import { jest } from "@jest/globals";
import { AppModule } from "../app.module.mjs";
import { BotService } from "../bot/bot.service.mjs";
import { CustomerTypeEnum } from "../order/constants/customer-type.enum.mjs";
import { OrderStatus } from "../order/constants/order-status.enum.mjs";
import { OrderService } from "../order/order.service.mjs";

/**
 * As McDonald's normal customer, after I submitted my order,
 * I wish to see my order flow into "PENDING" area.
 * After the cooking bot process my order,
 * I want to see it flow into to "COMPLETE" area.
 */
describe("Customer Order", () => {
  let app: INestApplication;
  let botService: BotService;
  let orderService: OrderService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    botService = app.get(BotService);
    orderService = app.get(OrderService);
  });

  afterEach(async () => {
    await app?.close();
  });

  const customerType = CustomerTypeEnum.REGULAR;

  async function waitFor(seconds: number) {
    return new Promise<void>((res) => setTimeout(res, seconds * 1000));
  }

  it("should display count down correctly", async () => {
    const botReadyEvent = botService.eventEmitter.waitFor("ready");
    botService.installNewBot();
    await botReadyEvent;

    const order = orderService.makeNewOrder("McBurger", customerType);

    // strategy: polling
    let updatedOrder = orderService.getOrderInfo(order.orderId);
    expect(updatedOrder.cookedBy).toBeDefined();
    expect(updatedOrder.status).toBe(OrderStatus.COOKING);
    let lastCookingDuration = updatedOrder.cookedBy!.currentCookingDuration;
    expect(lastCookingDuration).toEqual(updatedOrder.cookedBy!.cookingDuration);

    do {
      const currentCookingDuration =
        updatedOrder.cookedBy!.currentCookingDuration;
      expect(currentCookingDuration).toBeLessThanOrEqual(lastCookingDuration);
      lastCookingDuration = currentCookingDuration;
      await waitFor(1);
    } while (updatedOrder.cookedBy && lastCookingDuration > 0);

    let lastOrderUpdate = orderService.getOrderInfo(order.orderId);
    expect(lastCookingDuration).toBe(0);
    expect(lastOrderUpdate.status).toBe(OrderStatus.COMPLETED);
  }, 60000);
});

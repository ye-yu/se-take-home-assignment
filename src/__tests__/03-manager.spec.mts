import { INestApplication } from "@nestjs/common";
import { TestingModule, Test } from "@nestjs/testing";
import { jest } from "@jest/globals";
import { AppModule } from "../app.module.mjs";
import { BotService } from "../bot/bot.service.mjs";
import { CustomerTypeEnum } from "../order/constants/customer-type.enum.mjs";
import { OrderStatus } from "../order/constants/order-status.enum.mjs";
import { OrderService } from "../order/order.service.mjs";

/**
 * As McDonald's manager, I want to increase or decrease number of
 * cooking bot available in my restaurant. When I increase a bot,
 * it should immediately process any pending order.
 *
 * When I decrease a bot, the processing order should remain un-process.
 */
describe("McDonald's Manager", () => {
  let app: INestApplication;
  let botService: BotService;
  let orderService: OrderService;

  beforeEach(async () => {
    jest.useFakeTimers();

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

  async function installAndWaitForBotReady() {
    // now bot is installed, new order can be picked up
    const botReadyEvent = botService.eventEmitter.waitFor("ready");
    botService.installNewBot();
    await botReadyEvent;
  }

  async function uninstallAndWaitForBotShutdown() {
    // now bot is installed, new order can be picked up
    const botShutdownEvent = botService.eventEmitter.waitFor("shutdown");
    botService.uninstallOneBot();
    await botShutdownEvent;
  }

  it("should be able immediately pick up order on starting a new bot", async () => {
    expect(Object.values(botService.cookingBots)).toHaveLength(0);
    const order = orderService.makeNewOrder("McBurger", customerType);

    // strategy: polling
    const updatedOrder = orderService.getOrderInfo(order.orderId);
    expect(updatedOrder.status).toBe(OrderStatus.PENDING);

    // now bot is installed, new order can be picked up
    await installAndWaitForBotReady();
    expect(Object.values(botService.cookingBots)).toHaveLength(1);

    const updatedOrderAfterPickUp = orderService.getOrderInfo(order.orderId);
    expect(updatedOrderAfterPickUp.status).toBe(OrderStatus.COOKING);
  });
});

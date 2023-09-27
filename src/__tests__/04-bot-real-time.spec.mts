import { INestApplication } from "@nestjs/common";
import { TestingModule, Test } from "@nestjs/testing";
import { jest } from "@jest/globals";
import { AppModule } from "../app.module.mjs";
import { BotService } from "../bot/bot.service.mjs";
import { CustomerTypeEnum } from "../order/constants/customer-type.enum.mjs";
import { OrderStatus } from "../order/constants/order-status.enum.mjs";
import { OrderService } from "../order/order.service.mjs";

/**
 * As McDonald bot, it can only pickup and process 1 order at a time,
 * each order required 10 seconds to complete process.
 */
describe("Cooking Bot", () => {
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

  function sleepForAWhile() {
    return new Promise<void>((res) => setTimeout(res, 2000));
  }

  it.only("should be able return order status back to pending on unfinished cooking", async () => {
    await installAndWaitForBotReady();

    const order = orderService.makeNewOrder("McBurger", customerType);

    // strategy: polling
    const updatedOrder = orderService.getOrderInfo(order.orderId);
    expect(updatedOrder.status).toBe(OrderStatus.COOKING);

    const botShutdownEvent = botService.eventEmitter.waitFor("shutdown");
    botService.uninstallOneBot();
    await botShutdownEvent;

    await sleepForAWhile();

    const updatedOrderAftershutdown = orderService.getOrderInfo(order.orderId);
    expect(updatedOrderAftershutdown.status).toBe(OrderStatus.PENDING);
  }, 60000);
});

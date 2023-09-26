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
    const order = orderService.makeNewOrder("McBurger", customerType);

    // strategy: polling
    const updatedOrder = orderService.getOrderInfo(order.orderId);
    expect(updatedOrder.status).toBe(OrderStatus.PENDING);

    // now bot is installed, new order can be picked up
    await installAndWaitForBotReady();

    const updatedOrderAfterPickUp = orderService.getOrderInfo(order.orderId);
    expect(updatedOrderAfterPickUp.status).toBe(OrderStatus.COOKING);
  });

  it("should be able to process one order at a time", async () => {
    jest.useFakeTimers();
    jest.spyOn(global, "setTimeout");
    await installAndWaitForBotReady();
    const orders = [
      orderService.makeNewOrder("McBurger", customerType),
      orderService.makeNewOrder("McBurger", customerType),
    ];
    // setTimeout should only be called once, during cooking one order
    expect(setTimeout).toHaveBeenCalledTimes(1);

    // strategy: polling
    const [updatedOrder1, updatedOrder2] = orders.map(({ orderId }) =>
      orderService.getOrderInfo(orderId)
    );
    expect(updatedOrder1.status).toBe(OrderStatus.COOKING);
    expect(updatedOrder2.status).toBe(OrderStatus.PENDING);

    const botFinishedEvent = botService.eventEmitter.waitFor("finished");
    const botReadyEvent = botService.eventEmitter.waitFor("ready");
    jest.runOnlyPendingTimers();

    await botFinishedEvent;
    const updatedOrderAfterCooking1 = orderService.getOrderInfo(
      orders[0].orderId
    );
    expect(updatedOrderAfterCooking1.status).toBe(OrderStatus.COMPLETED);
    // setTimeout should now be called twice, to cook the next order
    expect(setTimeout).toHaveBeenCalledTimes(2);

    await botReadyEvent;
    const updatedOrderAfterWaiting2 = orderService.getOrderInfo(
      orders[1].orderId
    );
    expect(updatedOrderAfterWaiting2.status).toBe(OrderStatus.COOKING);

    const botFinishedEvent2 = botService.eventEmitter.waitFor("finished");
    jest.runOnlyPendingTimers();

    await botFinishedEvent2;
    const updatedOrderAfterCooking2 = orderService.getOrderInfo(
      orders[1].orderId
    );
    expect(updatedOrderAfterCooking2.status).toBe(OrderStatus.COMPLETED);
  });
});

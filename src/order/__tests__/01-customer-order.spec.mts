import { INestApplication } from "@nestjs/common";
import { TestingModule, Test } from "@nestjs/testing";
import { AppModule } from "../../app.module.mjs";
import { BotService } from "../../bot/bot.service.mjs";
import { OrderService } from "../order.service.mjs";
import { CustomerTypeEnum } from "../constants/customer-type.enum.mjs";
import { OrderStatus } from "../constants/order-status.enum.mjs";
import { jest } from "@jest/globals";

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

  it('should be able to see order flowing to "PENDING" on making order', async () => {
    const order = orderService.makeNewOrder("McBurger", customerType);

    // strategy: polling
    const updatedOrder = orderService.getOrderInfo(order.orderId);
    expect(updatedOrder.status).toBe(OrderStatus.PENDING);
  });

  it('should be able to see order flowing from "PENDING" to "COOKING" on picked up order', async () => {
    const order = orderService.makeNewOrder("McBurger", customerType);

    // strategy: polling
    const updatedOrder = orderService.getOrderInfo(order.orderId);
    expect(updatedOrder.status).toBe(OrderStatus.PENDING);

    // now bot is installed, new order can be picked up
    const botReadyEvent = botService.eventEmitter.waitFor("ready");
    botService.installNewBot();
    await botReadyEvent;

    const updatedOrderAfterPickUp = orderService.getOrderInfo(order.orderId);
    expect(updatedOrderAfterPickUp.status).toBe(OrderStatus.COOKING);
  });

  it('should be able to see order flowing from "PENDING" to "COMPLETED" on finished cooking', async () => {
    botService.installNewBot();
    const order = orderService.makeNewOrder("McBurger", customerType);

    // strategy: polling, status immediately goes to cooking because bot is available
    const updatedOrder = orderService.getOrderInfo(order.orderId);
    expect(updatedOrder.status).toBe(OrderStatus.COOKING);

    const botFinishedEvent = botService.eventEmitter.waitFor("finished");
    jest.runAllTimers();
    await botFinishedEvent;

    const updatedOrderAfterCooking = orderService.getOrderInfo(order.orderId);
    expect(updatedOrderAfterCooking.status).toBe(OrderStatus.COMPLETED);
  });
});

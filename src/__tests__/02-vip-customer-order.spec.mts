import { INestApplication } from "@nestjs/common";
import { TestingModule, Test } from "@nestjs/testing";
import { jest } from "@jest/globals";
import { AppModule } from "../app.module.mjs";
import { BotService } from "../bot/bot.service.mjs";
import { CustomerTypeEnum } from "../order/constants/customer-type.enum.mjs";
import { OrderStatus } from "../order/constants/order-status.enum.mjs";
import { OrderService } from "../order/order.service.mjs";

/**
 * As McDonald's VIP member, after I submitted my order,
 * I want my order being process first before all order by normal customer.
 *
 * However if there's existing order from VIP member,
 * my order should queue behind his/her order.
 */
describe("VIP Customer Order", () => {
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

  function makeNewRegularOrder() {
    return orderService.makeNewOrder("McBurger", CustomerTypeEnum.REGULAR);
  }

  function makeNewVIPOrder() {
    return orderService.makeNewOrder("McBurger", CustomerTypeEnum.VIP);
  }

  async function installAndWaitForBotReady() {
    // now bot is installed, new order can be picked up
    const botReadyEvent = botService.eventEmitter.waitFor("ready");
    botService.installNewBot();
    await botReadyEvent;
  }

  function sleepForAWhile() {
    return new Promise<void>((res) => setTimeout(res, 500));
  }

  it("should be able to have order processed first", async () => {
    jest.useRealTimers();
    const regularOrder = makeNewRegularOrder();
    await sleepForAWhile();
    const vipOrder = makeNewVIPOrder();
    jest.useFakeTimers();

    // proof that regular order was placed before vip
    expect(regularOrder.orderedAt.getTime()).toBeLessThan(
      vipOrder.orderedAt.getTime()
    );

    await installAndWaitForBotReady();

    const updatedRegularOrder = orderService.getOrderInfo(regularOrder.orderId);
    const updatedVipOrder = orderService.getOrderInfo(vipOrder.orderId);

    expect(updatedRegularOrder.status).toBe(OrderStatus.PENDING);
    expect(updatedVipOrder.status).toBe(OrderStatus.COOKING);
  });

  it("should be able to have order processed after another vip order", async () => {
    jest.useRealTimers();
    const regularOrder = makeNewRegularOrder();
    await sleepForAWhile();
    const vipOrder1 = makeNewVIPOrder();
    await sleepForAWhile();
    const vipOrder2 = makeNewVIPOrder();
    jest.useFakeTimers();

    // proof that regular order was placed before vip
    expect(regularOrder.orderedAt.getTime()).toBeLessThan(
      vipOrder1.orderedAt.getTime()
    );
    expect(vipOrder1.orderedAt.getTime()).toBeLessThan(
      vipOrder2.orderedAt.getTime()
    );

    await installAndWaitForBotReady();

    const updatedRegularOrder = orderService.getOrderInfo(regularOrder.orderId);
    const updatedVipOrder1 = orderService.getOrderInfo(vipOrder1.orderId);
    const updatedVipOrder2 = orderService.getOrderInfo(vipOrder2.orderId);

    expect(updatedRegularOrder.status).toBe(OrderStatus.PENDING);
    expect(updatedVipOrder1.status).toBe(OrderStatus.COOKING);
    // order 2 should be pending because all bot is still busy
    expect(updatedVipOrder2.status).toBe(OrderStatus.PENDING);
  });
});

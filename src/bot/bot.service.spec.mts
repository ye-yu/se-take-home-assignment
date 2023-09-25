import { TestingModule, Test } from "@nestjs/testing";
import { BotService } from "./bot.service.mjs";
import { INestApplication } from "@nestjs/common";
import { jest } from "@jest/globals";

describe("BotService", () => {
  let app: INestApplication;
  let botService: BotService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [BotService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    botService = app.get(BotService);
  });

  afterEach(async () => {
    await app?.close();
  });

  it("should be defined", () => {
    expect(botService).toBeDefined();
  });

  describe("boot up", () => {
    it("should call onBotReady handler on bot bootup", async () => {
      const fn = jest.fn();
      botService.onBotReady(fn);
      const promise = botService.eventEmitter.waitFor("bootup");
      botService.installNewBot();
      await promise;
      expect(fn).toBeCalledTimes(1);
    });
  });
});

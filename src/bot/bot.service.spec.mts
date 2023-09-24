import { TestingModule, Test } from "@nestjs/testing";
import { BotService } from "./bot.service.mjs";
import { INestApplication } from "@nestjs/common";

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
});

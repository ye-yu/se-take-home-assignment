import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "./app.module.mjs";
import { INestApplication } from "@nestjs/common";

describe("AppModule", () => {
  let app: INestApplication;
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it("should be defined", () => {
    expect(app).toBeDefined();
  });
});

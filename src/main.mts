import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.mjs";
import { Logger } from "@nestjs/common";

const app = await NestFactory.create(AppModule);
await app.listen(3000);
const logger = new Logger("main.mts");
logger.log(`Application listening at: 3000`);

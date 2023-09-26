import { Logger, Module, OnApplicationBootstrap } from "@nestjs/common";
import { BotModule } from "./bot/bot.module.mjs";
import { OrderModule } from "./order/order.module.mjs";

@Module({
  imports: [BotModule, OrderModule],
})
export class AppModule implements OnApplicationBootstrap {
  readonly logger = new Logger(AppModule.name);

  onApplicationBootstrap() {
    this.logger.log("Initialization");
  }
}

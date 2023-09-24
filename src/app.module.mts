import { Logger, Module, OnApplicationBootstrap } from "@nestjs/common";

@Module({})
export class AppModule implements OnApplicationBootstrap {
  readonly logger = new Logger(AppModule.name);

  onApplicationBootstrap() {
    this.logger.log("Initialization");
  }
}

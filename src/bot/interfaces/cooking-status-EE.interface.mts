import EventEmitter from "events";

export interface CookingStatusEventEmitter extends EventEmitter {
  emit(event: "finished" | "unfinished", orderId: number): boolean;
  emit(event: "bootup" | "shutdown", botName: string): boolean;
  once(
    event: "finished" | "unfinished",
    handler: (orderId: number) => void
  ): this;
  once(event: "bootup" | "shutdown", handler: (botName: string) => void): this;
}

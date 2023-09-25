import { EventEmitter2 } from "eventemitter2";

export interface CookingStatusEventEmitter extends EventEmitter2 {
  emit(event: "finished" | "unfinished", orderId: number): boolean;
  emit(event: "bootup" | "shutdown", botName: string): boolean;
  emit(event: "ready"): boolean;
  once(
    event: "finished" | "unfinished",
    handler: (orderId: number) => void
  ): this;
  once(event: "bootup" | "shutdown", handler: (botName: string) => void): this;
  once(event: "ready", handler: () => void): this;
}

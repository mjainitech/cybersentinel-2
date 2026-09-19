import fs from "node:fs/promises";
import path from "node:path";
import { logger } from "./logger";

/**
 * A JSON file used as a tiny embedded database. This keeps the
 * project runnable with zero external setup (no Postgres/Mongo to
 * install), which is the right tradeoff for this stage — swap this
 * for a real database by reimplementing read()/write() against it;
 * every caller (userStore, scanHistoryStore) only depends on this interface.
 *
 * Writes are serialized through a queue so concurrent requests can't
 * interleave and corrupt the file.
 */
export class JsonFileStore<T> {
  private queue: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string, private readonly defaultValue: T) {}

  async read(): Promise<T> {
    try {
      const raw = await fs.readFile(this.filePath, "utf-8");
      return JSON.parse(raw) as T;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        await this.write(this.defaultValue);
        return this.defaultValue;
      }
      logger.error("Failed to read data file — returning default value", {
        file: this.filePath,
        error: String(error),
      });
      return this.defaultValue;
    }
  }

  async write(value: T): Promise<void> {
    this.queue = this.queue.then(() => this.writeNow(value));
    return this.queue;
  }

  private async writeNow(value: T): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(value, null, 2), "utf-8");
  }
}

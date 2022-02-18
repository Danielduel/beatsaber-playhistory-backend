import redis from "./redis";
import GenericItem from "./model/GenericItem";
import {RedisJSON} from "@node-redis/json/dist/commands";

export const db = redis;
export const dbKey = (itemType: string, itemName: string) => `/db/${itemType}/${itemName}`;
export const dbGetById = <T>(...args: Parameters<typeof dbKey>): Promise<unknown[]> => {
  return new Promise(async (resolve, reject) => {
    const item = (await (await db).json.get(dbKey(...args))) as unknown[];
    if (item) {
      return resolve(item);
    }
    return reject("No data");
  })
}
export const dbCreateOrUpdate = <T extends GenericItem>(itemType: string, item: T) => {
  const itemKey = dbKey(itemType, item.id);
  return new Promise<T>(async (resolve, reject) => {
    await (await db).json.set(itemKey, ".", item as unknown as RedisJSON)
    resolve(item);
  });
}


import {createClient } from "redis";
// export type RedisJSON = Parameters<ReturnType<typeof createClient>["json"]["set"]>[2];

const redis = (async () => {
  const client = createClient();
  client.on("error", console.error);

  await client.connect();

  return client;
})();

export default redis;


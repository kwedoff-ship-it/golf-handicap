import * as LaunchDarkly from "launchdarkly-node-server-sdk";

const client = LaunchDarkly.init(process.env.LD_SDK_KEY!, {
  // Optional but good for POC visibility
  logger: LaunchDarkly.basicLogger({ level: "info" }),
});

export async function getFlag(
  flagKey: string,
  user = { key: "poc-user" }
): Promise<boolean> {
  await client.waitForInitialization();
  return client.variation(flagKey, user, false);
}

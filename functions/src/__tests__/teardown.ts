import { cleanupEnv } from "./utils/testEnv";

export default async () => {
  await cleanupEnv();
};

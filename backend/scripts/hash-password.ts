import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { hashPassword } from "../src/lib/password";

async function main() {
  const rl = createInterface({ input, output });
  const password = await rl.question("Owner password (minimum 12 characters): ");
  rl.close();

  if (password.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exit(1);
  }

  console.log(await hashPassword(password));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

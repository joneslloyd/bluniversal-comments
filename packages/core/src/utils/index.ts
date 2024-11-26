import * as fs from "fs";
import * as path from "path";

export const generateTaggedUrl = async (pageUrl: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pageUrl);

  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const tag = `bluniversal-${hashHex.slice(0, 43)}`;
  return tag;
};

export const updateEnvFile = (envFilePath: string, apiUrl: string) => {
  try {
    let envContent = "";
    if (fs.existsSync(envFilePath)) {
      envContent = fs.readFileSync(envFilePath, "utf-8");
    }
    const updatedContent = envContent
      .split("\n")
      .filter((line) => !line.startsWith("WXT_LAMBDA_URL="))
      .join("\n");

    const newEntry = `WXT_LAMBDA_URL=${apiUrl}`;
    const finalContent = updatedContent.trim()
      ? `${updatedContent}\n${newEntry}`
      : newEntry;
    fs.writeFileSync(envFilePath, finalContent, "utf-8");

    console.log(`.env file updated successfully with WXT_LAMBDA_URL=${apiUrl}`);
  } catch (error) {
    console.error("Error updating .env file:", error);
  }
};

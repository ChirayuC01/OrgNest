import { authMiddleware } from "@/server/middleware/auth";
import { success, error } from "@/helper/apiResponse";

export async function GET() {
  try {
    const user = await authMiddleware();
    return success(user);
  } catch {
    return error("Unauthorized", 401, "UNAUTHORIZED");
  }
}

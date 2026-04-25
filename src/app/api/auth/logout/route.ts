import { success } from "@/helper/apiResponse";

export async function POST() {
  const headers = new Headers({ "Content-Type": "application/json" });
  headers.append("Set-Cookie", "access_token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0");
  headers.append(
    "Set-Cookie",
    "refresh_token=; HttpOnly; SameSite=Strict; Path=/api/auth; Max-Age=0"
  );

  return new Response(JSON.stringify({ success: true, data: null }), { headers, status: 200 });
}

import { auth } from "@/lib/auth";

export default function proxy(request: Request) {
  return auth(request as any);
}

export const config = {
  matcher: [
    "/((?!login|verify|api/auth|api/verify|review|api/review|card-requests/review|_next/static|_next/image|favicon.ico).*)",
  ],
};

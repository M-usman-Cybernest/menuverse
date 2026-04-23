import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getOptionalSession } from "@/lib/session";

export default async function LoginPage() {
  const session = await getOptionalSession();

  if (session) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}

import { redirect } from "next/navigation";

import { SignupForm } from "@/components/auth/signup-form";
import { getOptionalSession } from "@/lib/session";

export default async function SignupPage() {
  const session = await getOptionalSession();

  if (session) {
    redirect("/dashboard");
  }

  return <SignupForm />;
}

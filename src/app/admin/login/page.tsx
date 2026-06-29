import { Suspense } from "react";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/session";
import LoginForm from "@/components/admin/LoginForm";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

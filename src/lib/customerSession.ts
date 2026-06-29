import { cookies } from "next/headers";
import { CUSTOMER_COOKIE, customerIdFromCookie } from "@/lib/customerAuth";
import { getCustomerById } from "@/lib/data/customers";
import type { Customer } from "@/lib/types";

export async function getCurrentCustomer(): Promise<Customer | null> {
  const id = customerIdFromCookie(cookies().get(CUSTOMER_COOKIE)?.value);
  if (!id) return null;
  return getCustomerById(id);
}

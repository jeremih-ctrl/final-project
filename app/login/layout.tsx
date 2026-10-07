import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vendor Portal Login | City Government of Butuan",
  description: "Sign in to the Butuan City Vendor Registration Portal",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

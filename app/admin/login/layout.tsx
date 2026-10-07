import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Portal Login | City Government of Butuan",
  description: "Authorized City Government personnel sign in",
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

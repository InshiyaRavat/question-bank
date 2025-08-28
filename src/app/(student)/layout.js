import { auth } from "@clerk/nextjs/server";

export default async function RootLayout({ children }) {
  return <div>{children}</div>;
}

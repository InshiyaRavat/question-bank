import "./globals.css";
import "./loading.css";
import { ClerkProvider } from "@clerk/nextjs";
import { PlanProvider } from "@/context/PlanContext";
import { AttemptedQuestionProvider } from "@/context/AttemptedQuestionContext";
import { SelectedTopicsProvider } from "@/context/SelectedTopicsContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { getSiteSettings as getSiteSettingsLib } from "@/lib/site-content";

const inter = Inter({ subsets: ["latin"] });

const getSiteSettings = async () => {
  try {
    const settings = await getSiteSettingsLib();
    return settings;
  } catch (error) {
    console.error("Error fetching site settings:", error);
    return {};
  }
};

export const generateMetadata = async () => {
  const settings = await getSiteSettings();
  return {
    title: settings.siteTitle || "Question Bank",
    description: settings.metaDescription || "Practice questions, test mode, analytics, and study tools.",
  };
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} antialiased`}>
          <ThemeProvider>
            <PlanProvider>
              <AttemptedQuestionProvider>
                <SelectedTopicsProvider>
                  <ToastProvider>{children}</ToastProvider>
                </SelectedTopicsProvider>
              </AttemptedQuestionProvider>
            </PlanProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

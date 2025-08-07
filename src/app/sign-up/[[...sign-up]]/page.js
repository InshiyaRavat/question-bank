"use client";
import { PlanContext } from "@/context/PlanContext";
import { useRouter } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import { useEffect, useContext } from "react";
import { THEME } from "@/theme";

export default function Page() {
  const { isSubscribed } = useContext(PlanContext);
  const router = useRouter();

  useEffect(() => {
    if (isSubscribed) {
      router.push("/question");
    }
  }, [isSubscribed, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: THEME.surface }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: THEME.textPrimary }}
          >
            Create Account
          </h1>
          <p
            className="text-base"
            style={{ color: THEME.textSecondary }}
          >
            Start your learning journey today
          </p>
        </div>
        <div className="w-full flex justify-center">
          <SignUp
            appearance={{
              elements: {
                rootBox: "w-full",
                card: `shadow-lg border-0 rounded-xl`,
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: `border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors`,
                socialButtonsBlockButtonText: "font-medium",
                dividerLine: "bg-gray-200",
                dividerText: "text-gray-500 text-sm",
                formFieldInput: `border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all`,
                formFieldLabel: "text-gray-700 font-medium text-sm",
                formButtonPrimary: `bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors w-full`,
                formFieldInputShowPasswordButton: "text-gray-500 hover:text-gray-700",
                footerActionLink: `text-blue-600 hover:text-blue-700 font-medium transition-colors`,
                identityPreviewText: "text-gray-700",
                identityPreviewEditButton: "text-blue-600 hover:text-blue-700",
                // Email verification styles
                formFieldInputShowPasswordIcon: "text-gray-500",
                verificationLinkStatusBox: "bg-blue-50 border border-blue-200 rounded-lg p-4",
                verificationLinkStatusText: "text-blue-800 text-sm",
                // Password requirements
                formFieldHintText: "text-gray-500 text-sm mt-1",
                formFieldWarningText: "text-amber-600 text-sm mt-1",
                formFieldErrorText: "text-red-600 text-sm mt-1",
                // Phone number verification (if enabled)
                phoneInputBox: "border border-gray-300 rounded-lg",
                formFieldPhoneInput: "px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
              },
              variables: {
                colorPrimary: THEME.primary,
                colorBackground: THEME.white,
                colorInputBackground: THEME.white,
                colorInputText: THEME.textPrimary,
                borderRadius: "0.75rem",
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
              }
            }}
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { useBranding, useContact } from "@/hooks/useSiteContent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, RefreshCw } from "lucide-react";

export default function MaintenancePage() {
  const { settings: branding, loading: brandingLoading } = useBranding();
  const { settings: contact, loading: contactLoading } = useContact();

  if (brandingLoading || contactLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const brandName = branding.brandName || "Our Site";
  const brandTagline = branding.brandTagline || "We'll be back soon!";
  const primaryColor = branding.primaryColor || "#3B82F6";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div
            className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: primaryColor }}
          >
            <RefreshCw className="h-8 w-8 text-white animate-spin" />
          </div>
          <CardTitle className="text-2xl font-bold" style={{ color: primaryColor }}>
            {brandName}
          </CardTitle>
          <CardDescription className="text-lg">{brandTagline}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">We&apos;re Currently Under Maintenance</h2>
            <p className="text-gray-600">We&apos;re working hard to improve your experience. Please check back soon!</p>
          </div>

          {/* Contact Information */}
          {(contact.contactEmail || contact.contactPhone || contact.contactAddress) && (
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4 text-center">Need Help?</h3>
              <div className="space-y-3">
                {contact.contactEmail && (
                  <div className="flex items-center space-x-3 text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <a href={`mailto:${contact.contactEmail}`} className="text-blue-600 hover:text-blue-800">
                      {contact.contactEmail}
                    </a>
                  </div>
                )}
                {contact.contactPhone && (
                  <div className="flex items-center space-x-3 text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <a href={`tel:${contact.contactPhone}`} className="text-blue-600 hover:text-blue-800">
                      {contact.contactPhone}
                    </a>
                  </div>
                )}
                {contact.contactAddress && (
                  <div className="flex items-center space-x-3 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{contact.contactAddress}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="text-center">
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

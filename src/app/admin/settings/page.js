"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Save, RotateCcw, AlertCircle } from "lucide-react";
import { AdminSidebar } from "@/components/Admin-side/AdminSidebar";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalSettings, setOriginalSettings] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      const data = await response.json();

      if (response.ok) {
        setSettings(data.settings);
        setOriginalSettings(data.settings);
      } else {
        toast.error(data.error || "Failed to fetch settings");
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        value: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Settings saved successfully!");
        setOriginalSettings(settings);
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(originalSettings);
    toast.info("Settings reset to last saved values");
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* <AdminSidebar /> */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
              <Settings className="h-8 w-8 text-blue-600" />
              System Settings
            </h1>
            <p className="text-slate-600">
              Configure system-wide settings and parameters
            </p>
          </div>

          <div className="space-y-6">
            {/* Accuracy Limit Setting */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Accuracy Threshold Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-orange-900 mb-1">
                        Personalized Report Accuracy Threshold
                      </h4>
                      <p className="text-sm text-orange-700">
                        This setting determines the accuracy threshold for marking topics as &quot;needs attention&quot;
                        in personalized reports. Adjust this based on the current exam cut-off rates.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="accuracyThreshold" className="text-sm font-medium">
                      Accuracy Threshold (%)
                    </Label>
                    <Input
                      id="accuracyThreshold"
                      type="number"
                      min="0"
                      max="100"
                      value={settings.accuracyThreshold?.value || "50"}
                      onChange={(e) => handleSettingChange("accuracyThreshold", e.target.value)}
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500">
                      Topics with accuracy below this percentage will be marked as &quot;needs attention&quot;
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Current Setting</Label>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={parseInt(settings.accuracyThreshold?.value || "50") >= 60 ? "destructive" : "default"}
                        className="text-lg px-3 py-1"
                      >
                        {settings.accuracyThreshold?.value || "50"}%
                      </Badge>
                      <span className="text-sm text-slate-600">
                        {parseInt(settings.accuracyThreshold?.value || "50") >= 60 ? "High threshold" : "Standard threshold"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Recommended Values:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>40% - Easy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span>50% - Standard</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span>60% - Challenging</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>70% - Very Hard</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Settings Placeholder */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Additional Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  More configuration options will be added here in future updates.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-8">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges || saving}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          {hasChanges && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                You have unsaved changes. Don&apos;t forget to save your settings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

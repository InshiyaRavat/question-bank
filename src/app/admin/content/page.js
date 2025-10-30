"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  Eye,
  Palette,
  Settings,
  ToggleLeft,
  ToggleRight,
  FileText,
  Image,
  Globe,
  Mail,
  Phone,
  MapPin,
  Twitter,
  Linkedin,
  Instagram,
  Facebook,
} from "lucide-react";
import { THEME } from "@/theme";

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState("branding");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Site Settings State
  const [siteSettings, setSiteSettings] = useState({
    // Branding
    brandName: "",
    logoUrl: "",
    faviconUrl: "",
    primaryColor: "#3B82F6",
    secondaryColor: "#1E40AF",
    accentColor: "#F59E0B",
    fontFamily: "Inter",
    brandTagline: "",

    // SEO
    siteTitle: "",
    metaDescription: "",

    // Contact
    contactEmail: "",
    contactPhone: "",
    contactAddress: "",

    // Social
    socialTwitter: "",
    socialLinkedin: "",
    socialInstagram: "",
    socialFacebook: "",

    // Features
    maintenanceMode: false,
    showSignup: true,
  });

  // Content Blocks State
  const [contentBlocks, setContentBlocks] = useState([]);
  const [contentBlockForm, setContentBlockForm] = useState({
    key: "",
    title: "",
    content: "",
    type: "text",
    category: "hero",
    isActive: true,
    sortOrder: 0,
    metadata: "",
  });
  const [contentBlockDialogOpen, setContentBlockDialogOpen] = useState(false);
  const [editingContentBlock, setEditingContentBlock] = useState(null);

  // Feature Toggles State
  const [featureToggles, setFeatureToggles] = useState([]);
  const [featureToggleForm, setFeatureToggleForm] = useState({
    key: "",
    name: "",
    description: "",
    isEnabled: false,
    category: "general",
  });
  const [featureToggleDialogOpen, setFeatureToggleDialogOpen] = useState(false);
  const [editingFeatureToggle, setEditingFeatureToggle] = useState(null);

  // Load site settings
  const loadSiteSettings = async () => {
    try {
      const response = await fetch("/api/admin/site-settings");
      if (!response.ok) throw new Error("Failed to fetch site settings");

      const data = await response.json();
      if (data.success && data.settings) {
        const settings = {};
        Object.values(data.settings).forEach((category) => {
          category.forEach((setting) => {
            let value = setting.value;
            if (setting.type === "boolean") {
              value = value === "true";
            } else if (setting.type === "number") {
              value = Number(value);
            } else if (setting.type === "json") {
              try {
                value = JSON.parse(value);
              } catch (e) {
                value = setting.value;
              }
            }
            settings[setting.key] = value;
          });
        });
        setSiteSettings((prev) => ({ ...prev, ...settings }));
      }
    } catch (error) {
      console.error("Error loading site settings:", error);
      toast.error("Failed to load site settings");
    }
  };

  // Load content blocks
  const loadContentBlocks = async () => {
    try {
      const response = await fetch("/api/admin/content-blocks");
      if (!response.ok) throw new Error("Failed to fetch content blocks");

      const data = await response.json();
      if (data.success) {
        setContentBlocks(data.contentBlocks || []);
      }
    } catch (error) {
      console.error("Error loading content blocks:", error);
      toast.error("Failed to load content blocks");
    }
  };

  // Load feature toggles
  const loadFeatureToggles = async () => {
    try {
      const response = await fetch("/api/admin/feature-toggles");
      if (!response.ok) throw new Error("Failed to fetch feature toggles");

      const data = await response.json();
      if (data.success) {
        setFeatureToggles(data.featureToggles || []);
      }
    } catch (error) {
      console.error("Error loading feature toggles:", error);
      toast.error("Failed to load feature toggles");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadSiteSettings(), loadContentBlocks(), loadFeatureToggles()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Save site settings
  const saveSiteSettings = async () => {
    setSaving(true);
    try {
      const settings = Object.entries(siteSettings).map(([key, value]) => {
        let type = "string";
        if (typeof value === "boolean") type = "boolean";
        else if (typeof value === "number") type = "number";

        let category = "general";
        if (
          [
            "brandName",
            "logoUrl",
            "faviconUrl",
            "primaryColor",
            "secondaryColor",
            "accentColor",
            "fontFamily",
            "brandTagline",
          ].includes(key)
        ) {
          category = "branding";
        } else if (["siteTitle", "metaDescription"].includes(key)) {
          category = "seo";
        } else if (["contactEmail", "contactPhone", "contactAddress"].includes(key)) {
          category = "contact";
        } else if (key.startsWith("social")) {
          category = "social";
        } else if (["maintenanceMode", "showSignup"].includes(key)) {
          category = "features";
        }

        return { key, value: String(value), type, category };
      });

      const response = await fetch("/api/admin/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save settings");
      }

      toast.success("Site settings saved successfully");
    } catch (error) {
      console.error("Error saving site settings:", error);
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  // Content Block Functions
  const handleCreateContentBlock = async () => {
    try {
      const response = await fetch("/api/admin/content-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contentBlockForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create content block");
      }

      toast.success("Content block created successfully");
      setContentBlockDialogOpen(false);
      setContentBlockForm({
        key: "",
        title: "",
        content: "",
        type: "text",
        category: "hero",
        isActive: true,
        sortOrder: 0,
        metadata: "",
      });
      loadContentBlocks();
    } catch (error) {
      console.error("Error creating content block:", error);
      toast.error(error.message);
    }
  };

  const handleUpdateContentBlock = async () => {
    try {
      const response = await fetch(`/api/admin/content-blocks/${editingContentBlock.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contentBlockForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update content block");
      }

      toast.success("Content block updated successfully");
      setContentBlockDialogOpen(false);
      setEditingContentBlock(null);
      setContentBlockForm({
        key: "",
        title: "",
        content: "",
        type: "text",
        category: "hero",
        isActive: true,
        sortOrder: 0,
        metadata: "",
      });
      loadContentBlocks();
    } catch (error) {
      console.error("Error updating content block:", error);
      toast.error(error.message);
    }
  };

  const handleDeleteContentBlock = async (id) => {
    if (!confirm("Are you sure you want to delete this content block?")) return;

    try {
      const response = await fetch(`/api/admin/content-blocks/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete content block");
      }

      toast.success("Content block deleted successfully");
      loadContentBlocks();
    } catch (error) {
      console.error("Error deleting content block:", error);
      toast.error(error.message);
    }
  };

  // Feature Toggle Functions
  const handleCreateFeatureToggle = async () => {
    try {
      const response = await fetch("/api/admin/feature-toggles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(featureToggleForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create feature toggle");
      }

      toast.success("Feature toggle created successfully");
      setFeatureToggleDialogOpen(false);
      setFeatureToggleForm({
        key: "",
        name: "",
        description: "",
        isEnabled: false,
        category: "general",
      });
      loadFeatureToggles();
    } catch (error) {
      console.error("Error creating feature toggle:", error);
      toast.error(error.message);
    }
  };

  const handleUpdateFeatureToggle = async () => {
    try {
      const response = await fetch(`/api/admin/feature-toggles/${editingFeatureToggle.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(featureToggleForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update feature toggle");
      }

      toast.success("Feature toggle updated successfully");
      setFeatureToggleDialogOpen(false);
      setEditingFeatureToggle(null);
      setFeatureToggleForm({
        key: "",
        name: "",
        description: "",
        isEnabled: false,
        category: "general",
      });
      loadFeatureToggles();
    } catch (error) {
      console.error("Error updating feature toggle:", error);
      toast.error(error.message);
    }
  };

  const handleDeleteFeatureToggle = async (id) => {
    if (!confirm("Are you sure you want to delete this feature toggle?")) return;

    try {
      const response = await fetch(`/api/admin/feature-toggles/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete feature toggle");
      }

      toast.success("Feature toggle deleted successfully");
      loadFeatureToggles();
    } catch (error) {
      console.error("Error deleting feature toggle:", error);
      toast.error(error.message);
    }
  };

  const toggleFeatureToggle = async (id, isEnabled) => {
    try {
      const response = await fetch(`/api/admin/feature-toggles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update feature toggle");
      }

      loadFeatureToggles();
    } catch (error) {
      console.error("Error toggling feature:", error);
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading content management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: THEME.textPrimary }}>
            Content Management
          </h1>
          <p className="mt-1" style={{ color: THEME.textSecondary }}>
            Manage site content, branding, and feature toggles
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadSiteSettings();
              loadContentBlocks();
              loadFeatureToggles();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="branding">Branding & SEO</TabsTrigger>
          <TabsTrigger value="content">Content Blocks</TabsTrigger>
          <TabsTrigger value="features">Feature Toggles</TabsTrigger>
        </TabsList>

        {/* Branding & SEO Tab */}
        <TabsContent value="branding" className="space-y-6">
          <div className="grid gap-6">
            {/* Branding Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>Branding</span>
                </CardTitle>
                <CardDescription>Configure your site&apos;s visual identity and branding</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brandName">Brand Name</Label>
                    <Input
                      id="brandName"
                      value={siteSettings.brandName}
                      onChange={(e) => setSiteSettings({ ...siteSettings, brandName: e.target.value })}
                      placeholder="Your Brand Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="brandTagline">Brand Tagline</Label>
                    <Input
                      id="brandTagline"
                      value={siteSettings.brandTagline}
                      onChange={(e) => setSiteSettings({ ...siteSettings, brandTagline: e.target.value })}
                      placeholder="Your Brand Tagline"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="logoUrl">Logo URL</Label>
                    <Input
                      id="logoUrl"
                      value={siteSettings.logoUrl}
                      onChange={(e) => setSiteSettings({ ...siteSettings, logoUrl: e.target.value })}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  <div>
                    <Label htmlFor="faviconUrl">Favicon URL</Label>
                    <Input
                      id="faviconUrl"
                      value={siteSettings.faviconUrl}
                      onChange={(e) => setSiteSettings({ ...siteSettings, faviconUrl: e.target.value })}
                      placeholder="https://example.com/favicon.ico"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={siteSettings.primaryColor}
                        onChange={(e) => setSiteSettings({ ...siteSettings, primaryColor: e.target.value })}
                        className="w-16 h-10"
                      />
                      <Input
                        value={siteSettings.primaryColor}
                        onChange={(e) => setSiteSettings({ ...siteSettings, primaryColor: e.target.value })}
                        placeholder="#3B82F6"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={siteSettings.secondaryColor}
                        onChange={(e) => setSiteSettings({ ...siteSettings, secondaryColor: e.target.value })}
                        className="w-16 h-10"
                      />
                      <Input
                        value={siteSettings.secondaryColor}
                        onChange={(e) => setSiteSettings({ ...siteSettings, secondaryColor: e.target.value })}
                        placeholder="#1E40AF"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="accentColor">Accent Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="accentColor"
                        type="color"
                        value={siteSettings.accentColor}
                        onChange={(e) => setSiteSettings({ ...siteSettings, accentColor: e.target.value })}
                        className="w-16 h-10"
                      />
                      <Input
                        value={siteSettings.accentColor}
                        onChange={(e) => setSiteSettings({ ...siteSettings, accentColor: e.target.value })}
                        placeholder="#F59E0B"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="fontFamily">Font Family</Label>
                  <Select
                    value={siteSettings.fontFamily}
                    onValueChange={(value) => setSiteSettings({ ...siteSettings, fontFamily: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                      <SelectItem value="Lato">Lato</SelectItem>
                      <SelectItem value="Poppins">Poppins</SelectItem>
                      <SelectItem value="Montserrat">Montserrat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* SEO Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>SEO & Meta</span>
                </CardTitle>
                <CardDescription>Configure SEO settings and meta information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="siteTitle">Site Title</Label>
                  <Input
                    id="siteTitle"
                    value={siteSettings.siteTitle}
                    onChange={(e) => setSiteSettings({ ...siteSettings, siteTitle: e.target.value })}
                    placeholder="Your Site Title"
                  />
                </div>
                <div>
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    value={siteSettings.metaDescription}
                    onChange={(e) => setSiteSettings({ ...siteSettings, metaDescription: e.target.value })}
                    placeholder="Your site's meta description for search engines"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact & Social Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-5 w-5" />
                  <span>Contact & Social</span>
                </CardTitle>
                <CardDescription>Configure contact information and social media links</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={siteSettings.contactEmail}
                      onChange={(e) => setSiteSettings({ ...siteSettings, contactEmail: e.target.value })}
                      placeholder="contact@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      value={siteSettings.contactPhone}
                      onChange={(e) => setSiteSettings({ ...siteSettings, contactPhone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactAddress">Contact Address</Label>
                    <Input
                      id="contactAddress"
                      value={siteSettings.contactAddress}
                      onChange={(e) => setSiteSettings({ ...siteSettings, contactAddress: e.target.value })}
                      placeholder="123 Main St, City, State"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="socialTwitter">Twitter URL</Label>
                    <Input
                      id="socialTwitter"
                      value={siteSettings.socialTwitter}
                      onChange={(e) => setSiteSettings({ ...siteSettings, socialTwitter: e.target.value })}
                      placeholder="https://twitter.com/yourbrand"
                    />
                  </div>
                  <div>
                    <Label htmlFor="socialLinkedin">LinkedIn URL</Label>
                    <Input
                      id="socialLinkedin"
                      value={siteSettings.socialLinkedin}
                      onChange={(e) => setSiteSettings({ ...siteSettings, socialLinkedin: e.target.value })}
                      placeholder="https://linkedin.com/company/yourbrand"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="socialInstagram">Instagram URL</Label>
                    <Input
                      id="socialInstagram"
                      value={siteSettings.socialInstagram}
                      onChange={(e) => setSiteSettings({ ...siteSettings, socialInstagram: e.target.value })}
                      placeholder="https://instagram.com/yourbrand"
                    />
                  </div>
                  <div>
                    <Label htmlFor="socialFacebook">Facebook URL</Label>
                    <Input
                      id="socialFacebook"
                      value={siteSettings.socialFacebook}
                      onChange={(e) => setSiteSettings({ ...siteSettings, socialFacebook: e.target.value })}
                      placeholder="https://facebook.com/yourbrand"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={saveSiteSettings} disabled={saving}>
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Content Blocks Tab */}
        <TabsContent value="content" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Content Blocks</h2>
            <Dialog open={contentBlockDialogOpen} onOpenChange={setContentBlockDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Content Block
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingContentBlock ? "Edit Content Block" : "Create Content Block"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contentKey">Key *</Label>
                      <Input
                        id="contentKey"
                        value={contentBlockForm.key}
                        onChange={(e) => setContentBlockForm({ ...contentBlockForm, key: e.target.value })}
                        placeholder="hero-headline"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contentTitle">Title *</Label>
                      <Input
                        id="contentTitle"
                        value={contentBlockForm.title}
                        onChange={(e) => setContentBlockForm({ ...contentBlockForm, title: e.target.value })}
                        placeholder="Hero Headline"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contentType">Type</Label>
                      <Select
                        value={contentBlockForm.type}
                        onValueChange={(value) => setContentBlockForm({ ...contentBlockForm, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="html">HTML</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="image">Image</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="contentCategory">Category</Label>
                      <Select
                        value={contentBlockForm.category}
                        onValueChange={(value) => setContentBlockForm({ ...contentBlockForm, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hero">Hero</SelectItem>
                          <SelectItem value="features">Features</SelectItem>
                          <SelectItem value="testimonials">Testimonials</SelectItem>
                          <SelectItem value="footer">Footer</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="contentContent">Content *</Label>
                    <Textarea
                      id="contentContent"
                      value={contentBlockForm.content}
                      onChange={(e) => setContentBlockForm({ ...contentBlockForm, content: e.target.value })}
                      placeholder="Enter your content here..."
                      rows={6}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contentSortOrder">Sort Order</Label>
                      <Input
                        id="contentSortOrder"
                        type="number"
                        value={contentBlockForm.sortOrder}
                        onChange={(e) =>
                          setContentBlockForm({ ...contentBlockForm, sortOrder: parseInt(e.target.value) || 0 })
                        }
                        placeholder="0"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="contentIsActive"
                        checked={contentBlockForm.isActive}
                        onCheckedChange={(checked) => setContentBlockForm({ ...contentBlockForm, isActive: checked })}
                      />
                      <Label htmlFor="contentIsActive">Active</Label>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="contentMetadata">Metadata (JSON)</Label>
                    <Textarea
                      id="contentMetadata"
                      value={contentBlockForm.metadata}
                      onChange={(e) => setContentBlockForm({ ...contentBlockForm, metadata: e.target.value })}
                      placeholder='{"key": "value"}'
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setContentBlockDialogOpen(false);
                      setEditingContentBlock(null);
                      setContentBlockForm({
                        key: "",
                        title: "",
                        content: "",
                        type: "text",
                        category: "hero",
                        isActive: true,
                        sortOrder: 0,
                        metadata: "",
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={editingContentBlock ? handleUpdateContentBlock : handleCreateContentBlock}>
                    {editingContentBlock ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Content Blocks List */}
          <div className="grid gap-4">
            {contentBlocks.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No content blocks found</p>
                </CardContent>
              </Card>
            ) : (
              contentBlocks.map((block) => (
                <Card key={block.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold">{block.title}</h3>
                          <Badge variant="outline">{block.category}</Badge>
                          <Badge variant={block.isActive ? "default" : "secondary"}>
                            {block.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Key:</span> {block.key}
                          </div>
                          <div>
                            <span className="font-medium">Type:</span> {block.type}
                          </div>
                          <div>
                            <span className="font-medium">Sort Order:</span> {block.sortOrder}
                          </div>
                          <div>
                            <span className="font-medium">Content:</span> {block.content.substring(0, 50)}...
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingContentBlock(block);
                            setContentBlockForm({
                              key: block.key,
                              title: block.title,
                              content: block.content,
                              type: block.type,
                              category: block.category,
                              isActive: block.isActive,
                              sortOrder: block.sortOrder,
                              metadata: block.metadata || "",
                            });
                            setContentBlockDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteContentBlock(block.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Feature Toggles Tab */}
        <TabsContent value="features" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Feature Toggles</h2>
            <Dialog open={featureToggleDialogOpen} onOpenChange={setFeatureToggleDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Feature Toggle
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingFeatureToggle ? "Edit Feature Toggle" : "Create Feature Toggle"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="toggleKey">Key *</Label>
                      <Input
                        id="toggleKey"
                        value={featureToggleForm.key}
                        onChange={(e) => setFeatureToggleForm({ ...featureToggleForm, key: e.target.value })}
                        placeholder="maintenance-mode"
                      />
                    </div>
                    <div>
                      <Label htmlFor="toggleName">Name *</Label>
                      <Input
                        id="toggleName"
                        value={featureToggleForm.name}
                        onChange={(e) => setFeatureToggleForm({ ...featureToggleForm, name: e.target.value })}
                        placeholder="Maintenance Mode"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="toggleDescription">Description</Label>
                    <Textarea
                      id="toggleDescription"
                      value={featureToggleForm.description}
                      onChange={(e) => setFeatureToggleForm({ ...featureToggleForm, description: e.target.value })}
                      placeholder="Description of this feature toggle..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="toggleCategory">Category</Label>
                      <Select
                        value={featureToggleForm.category}
                        onValueChange={(value) => setFeatureToggleForm({ ...featureToggleForm, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="features">Features</SelectItem>
                          <SelectItem value="ui">UI</SelectItem>
                          <SelectItem value="api">API</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="toggleIsEnabled"
                        checked={featureToggleForm.isEnabled}
                        onCheckedChange={(checked) =>
                          setFeatureToggleForm({ ...featureToggleForm, isEnabled: checked })
                        }
                      />
                      <Label htmlFor="toggleIsEnabled">Enabled</Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFeatureToggleDialogOpen(false);
                      setEditingFeatureToggle(null);
                      setFeatureToggleForm({
                        key: "",
                        name: "",
                        description: "",
                        isEnabled: false,
                        category: "general",
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={editingFeatureToggle ? handleUpdateFeatureToggle : handleCreateFeatureToggle}>
                    {editingFeatureToggle ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Feature Toggles List */}
          <div className="grid gap-4">
            {featureToggles.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <ToggleLeft className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No feature toggles found</p>
                </CardContent>
              </Card>
            ) : (
              featureToggles.map((toggle) => (
                <Card key={toggle.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold">{toggle.name}</h3>
                          <Badge variant="outline">{toggle.category}</Badge>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={toggle.isEnabled}
                              onCheckedChange={(checked) => toggleFeatureToggle(toggle.id, checked)}
                            />
                            <span className="text-sm text-gray-600">{toggle.isEnabled ? "Enabled" : "Disabled"}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Key:</span> {toggle.key}
                          </div>
                          <div>
                            <span className="font-medium">Category:</span> {toggle.category}
                          </div>
                          <div>
                            <span className="font-medium">Description:</span> {toggle.description || "No description"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingFeatureToggle(toggle);
                            setFeatureToggleForm({
                              key: toggle.key,
                              name: toggle.name,
                              description: toggle.description || "",
                              isEnabled: toggle.isEnabled,
                              category: toggle.category,
                            });
                            setFeatureToggleDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteFeatureToggle(toggle.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";
import React, { useState, useEffect, useRef } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Image as ImageIcon, Trash2, Eye, AlertCircle, CheckCircle } from "lucide-react";
import { THEME } from "@/theme";

export default function LogoManagementPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [username, setUsername] = useState("");
  const [currentLogo, setCurrentLogo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      setUsername(user.username || "");
    }
  }, [isLoaded, user, isSignedIn]);

  const fetchCurrentLogo = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/logo");
      if (response.ok) {
        const data = await response.json();
        setCurrentLogo(data.logo);
        if (data.logo) {
          setPreviewImage(data.logo.data);
        }
      } else {
        console.error("Failed to fetch current logo");
      }
    } catch (error) {
      console.error("Error fetching current logo:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchCurrentLogo();
    }
  }, [isLoaded, isSignedIn]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadStatus({
        type: "error",
        message: "Please select a valid image file (PNG, JPG, GIF, etc.)",
      });
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      setUploadStatus({
        type: "error",
        message: "File size must be less than 2MB",
      });
      return;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target.result;
      setPreviewImage(base64Data);
      setUploadStatus(null);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!previewImage) return;

    try {
      setUploading(true);
      setUploadStatus(null);

      const file = fileInputRef.current?.files[0];
      const logoData = {
        logoData: previewImage,
        logoName: file?.name || "logo",
        logoSize: file?.size || 0,
        logoType: file?.type || "image/png",
      };

      const response = await fetch("/api/admin/logo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(logoData),
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentLogo(data.logo);
        setUploadStatus({
          type: "success",
          message: "Logo uploaded successfully!",
        });
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setUploadStatus({
          type: "error",
          message: data.error || "Failed to upload logo",
        });
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      setUploadStatus({
        type: "error",
        message: "Failed to upload logo. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!confirm("Are you sure you want to remove the current logo?")) {
      return;
    }

    try {
      setUploading(true);
      const response = await fetch("/api/admin/logo", {
        method: "DELETE",
      });

      if (response.ok) {
        setCurrentLogo(null);
        setPreviewImage(null);
        setUploadStatus({
          type: "success",
          message: "Logo removed successfully!",
        });
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        const data = await response.json();
        setUploadStatus({
          type: "error",
          message: data.error || "Failed to remove logo",
        });
      }
    } catch (error) {
      console.error("Error removing logo:", error);
      setUploadStatus({
        type: "error",
        message: "Failed to remove logo. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  const clearPreview = () => {
    setPreviewImage(currentLogo?.data || null);
    setUploadStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <SidebarInset className="text-black">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading logo settings...</p>
          </div>
        </div>
      </SidebarInset>
    );
  }

  return (
    <SidebarInset className="text-black">
      {/* HEADER */}
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 bg-white">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-xl font-semibold" style={{ color: THEME.neutral900 }}>
            Logo Management
          </h1>
        </div>

        {/* Profile Section */}
        <div className="ml-auto flex items-center gap-4 px-4">
          <div className="flex items-center gap-3">
            <UserButton />
            <span className="text-sm font-medium" style={{ color: THEME.neutral900 }}>
              {username}
            </span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-white">
        <div className="min-h-[100vh] flex-1 rounded-xl md:min-h-min" style={{ backgroundColor: THEME.neutral50 }}>
          <div className="p-6">
            {/* Status Messages */}
            {uploadStatus && (
              <Alert
                className={`mb-6 ${
                  uploadStatus.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"
                }`}
              >
                {uploadStatus.type === "error" ? (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                <AlertDescription className={uploadStatus.type === "error" ? "text-red-800" : "text-green-800"}>
                  {uploadStatus.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Current Logo Display */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Current Logo
                  </CardTitle>
                  <CardDescription>This is the logo currently displayed on your site</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    {currentLogo ? (
                      <div className="text-center">
                        <img
                          src={currentLogo.data}
                          alt="Current Site Logo"
                          className="max-w-full max-h-48 object-contain mb-4 rounded-lg shadow-sm"
                        />
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <strong>Name:</strong> {currentLogo.name}
                          </p>
                          <p>
                            <strong>Size:</strong> {(currentLogo.size / 1024).toFixed(1)} KB
                          </p>
                          <p>
                            <strong>Type:</strong> {currentLogo.type}
                          </p>
                          {currentLogo.uploadedAt && (
                            <p>
                              <strong>Uploaded:</strong> {new Date(currentLogo.uploadedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleRemoveLogo}
                          disabled={uploading}
                          className="mt-4"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove Logo
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500">
                        <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium">No Logo Configured</p>
                        <p className="text-sm">Upload a logo to customize your site branding</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Logo Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload New Logo
                  </CardTitle>
                  <CardDescription>
                    Upload a new logo to replace the current one. Supported formats: PNG, JPG, GIF (Max 2MB)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* File Input */}
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>

                    {/* Preview */}
                    {previewImage && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                        <div className="text-center">
                          <img
                            src={previewImage}
                            alt="Logo Preview"
                            className="max-w-full max-h-32 object-contain mx-auto mb-4 rounded-lg"
                          />
                          <p className="text-sm text-gray-600 mb-4">Preview</p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        onClick={handleUpload}
                        disabled={!previewImage || uploading || previewImage === currentLogo?.data}
                        className="flex-1"
                      >
                        {uploading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Uploading...
                          </div>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-1" />
                            Upload Logo
                          </>
                        )}
                      </Button>

                      {previewImage && previewImage !== currentLogo?.data && (
                        <Button variant="outline" onClick={clearPreview} disabled={uploading}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Guidelines */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Logo Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2">Technical Requirements:</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Maximum file size: 2MB</li>
                      <li>• Supported formats: PNG, JPG, GIF, WebP</li>
                      <li>• Recommended dimensions: 200x50px to 400x100px</li>
                      <li>• Transparent backgrounds work best (PNG)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Design Recommendations:</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Use high contrast for better visibility</li>
                      <li>• Keep it simple and readable at small sizes</li>
                      <li>• Consider how it looks on both light and dark backgrounds</li>
                      <li>• Test on different devices and screen sizes</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}

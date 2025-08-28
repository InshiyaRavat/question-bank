"use client";
import React, { useState, useEffect } from "react";
import { Stethoscope } from "lucide-react";

const DynamicLogo = ({ className = "", fallbackText = "MedQuest", showText = true, size = "md" }) => {
  const [logo, setLogo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Size configurations
  const sizeConfig = {
    sm: {
      icon: "h-6 w-6",
      text: "text-lg",
      container: "gap-1",
    },
    md: {
      icon: "h-8 w-8",
      text: "text-xl",
      container: "gap-2",
    },
    lg: {
      icon: "h-12 w-12",
      text: "text-2xl",
      container: "gap-3",
    },
    xl: {
      icon: "h-16 w-16",
      text: "text-3xl",
      container: "gap-4",
    },
  };

  const config = sizeConfig[size] || sizeConfig.md;

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch("/api/admin/logo");
        if (response.ok) {
          const data = await response.json();
          if (data.logo && data.logo.data) {
            setLogo(data.logo);
          }
        }
      } catch (err) {
        console.error("Error fetching logo:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchLogo();
  }, []);

  // Show loading state briefly
  if (loading) {
    return (
      <div className={`flex items-center ${config.container} ${className}`}>
        <div className={`${config.icon} bg-gray-200 animate-pulse rounded`}></div>
        {showText && <div className={`${config.text} bg-gray-200 animate-pulse rounded h-6 w-24`}></div>}
      </div>
    );
  }

  // If we have a custom logo and no error loading it
  if (logo && logo.data && !error) {
    return (
      <div className={`flex items-center ${config.container} ${className}`}>
        <img
          src={logo.data}
          alt={logo.name || "Site Logo"}
          className={`${config.icon} object-contain`}
          onError={() => setError(true)}
        />
        {showText && fallbackText && <span className={`${config.text} font-bold`}>{fallbackText}</span>}
      </div>
    );
  }

  // Fallback to default logo
  return (
    <div className={`flex items-center ${config.container} ${className}`}>
      <Stethoscope className={`${config.icon} text-blue-600`} />
      {showText && <span className={`${config.text} font-bold text-slate-900`}>{fallbackText}</span>}
    </div>
  );
};

export default DynamicLogo;

"use client";
import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import AddQuestion from "@/components/Admin-side/AddQuestion";

export default function AdminDashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      setUsername(user.username);
    }
  }, [isLoaded, user, isSignedIn]);

  return (
    <div>
        <AddQuestion/>
    </div>
  );
}

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
import { toast } from "sonner";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  Eye,
  Tag,
  Percent,
  DollarSign,
  Calendar,
  Users,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { THEME } from "@/theme";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [promotionCodes, setPromotionCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [promotionCodesLoading, setPromotionCodesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("coupons");

  // Coupon form state
  const [couponForm, setCouponForm] = useState({
    name: "",
    id: "",
    percent_off: "",
    amount_off: "",
    currency: "gbp",
    duration: "once",
    duration_in_months: "",
    max_redemptions: "",
    redeem_by: "",
    applies_to_products: [],
  });
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  // Promotion code form state
  const [promotionCodeForm, setPromotionCodeForm] = useState({
    coupon_id: "",
    code: "",
    active: true,
    max_redemptions: "",
    expires_at: "",
    restrictions: {
      first_time_transaction: false,
      minimum_amount: "",
      minimum_amount_currency: "gbp",
    },
  });
  const [promotionCodeDialogOpen, setPromotionCodeDialogOpen] = useState(false);
  const [editingPromotionCode, setEditingPromotionCode] = useState(null);

  // Fetch coupons
  const fetchCoupons = async () => {
    try {
      setCouponsLoading(true);
      const response = await fetch("/api/admin/coupons");
      if (!response.ok) throw new Error("Failed to fetch coupons");

      const data = await response.json();
      setCoupons(data.coupons || []);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast.error("Failed to fetch coupons");
    } finally {
      setCouponsLoading(false);
    }
  };

  // Fetch promotion codes
  const fetchPromotionCodes = async () => {
    try {
      setPromotionCodesLoading(true);
      const response = await fetch("/api/admin/promotion-codes");
      if (!response.ok) throw new Error("Failed to fetch promotion codes");

      const data = await response.json();
      setPromotionCodes(data.promotion_codes || []);
    } catch (error) {
      console.error("Error fetching promotion codes:", error);
      toast.error("Failed to fetch promotion codes");
    } finally {
      setPromotionCodesLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCoupons(), fetchPromotionCodes()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Create coupon
  const handleCreateCoupon = async () => {
    try {
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(couponForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create coupon");
      }

      toast.success("Coupon created successfully");
      setCouponDialogOpen(false);
      setCouponForm({
        name: "",
        id: "",
        percent_off: "",
        amount_off: "",
        currency: "gbp",
        duration: "once",
        duration_in_months: "",
        max_redemptions: "",
        redeem_by: "",
        applies_to_products: [],
      });
      fetchCoupons();
    } catch (error) {
      console.error("Error creating coupon:", error);
      toast.error(error.message);
    }
  };

  // Create promotion code
  const handleCreatePromotionCode = async () => {
    try {
      const response = await fetch("/api/admin/promotion-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(promotionCodeForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create promotion code");
      }

      toast.success("Promotion code created successfully");
      setPromotionCodeDialogOpen(false);
      setPromotionCodeForm({
        coupon_id: "",
        code: "",
        active: true,
        max_redemptions: "",
        expires_at: "",
        restrictions: {
          first_time_transaction: false,
          minimum_amount: "",
          minimum_amount_currency: "gbp",
        },
      });
      fetchPromotionCodes();
    } catch (error) {
      console.error("Error creating promotion code:", error);
      toast.error(error.message);
    }
  };

  // Delete coupon
  const handleDeleteCoupon = async (couponId) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete coupon");
      }

      toast.success("Coupon deleted successfully");
      fetchCoupons();
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast.error(error.message);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // Format currency
  const formatCurrency = (amount, currency = "gbp") => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return "Never";
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // Get coupon status badge
  const getCouponStatusBadge = (coupon) => {
    if (coupon.valid) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          Active
        </Badge>
      );
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  // Get promotion code status badge
  const getPromotionCodeStatusBadge = (promotionCode) => {
    if (promotionCode.active) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          Active
        </Badge>
      );
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  // Filter coupons and promotion codes
  const filteredCoupons = coupons.filter(
    (coupon) =>
      coupon.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPromotionCodes = promotionCodes.filter(
    (promoCode) =>
      promoCode.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promoCode.coupon?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading coupons...</p>
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
            Coupons & Discounts
          </h1>
          <p className="mt-1" style={{ color: THEME.textSecondary }}>
            Manage discount coupons and promotion codes
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (activeTab === "coupons") fetchCoupons();
              else fetchPromotionCodes();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search coupons or promotion codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="coupons">Coupons ({filteredCoupons.length})</TabsTrigger>
          <TabsTrigger value="promotion-codes">Promotion Codes ({filteredPromotionCodes.length})</TabsTrigger>
        </TabsList>

        {/* Coupons Tab */}
        <TabsContent value="coupons" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Coupons</h2>
            <Dialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Coupon
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Coupon</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={couponForm.name}
                        onChange={(e) => setCouponForm({ ...couponForm, name: e.target.value })}
                        placeholder="e.g., 25% Off"
                      />
                    </div>
                    <div>
                      <Label htmlFor="id">ID (optional)</Label>
                      <Input
                        id="id"
                        value={couponForm.id}
                        onChange={(e) => setCouponForm({ ...couponForm, id: e.target.value })}
                        placeholder="auto-generated if empty"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="percent_off">Percentage Off</Label>
                      <Input
                        id="percent_off"
                        type="number"
                        min="0"
                        max="100"
                        value={couponForm.percent_off}
                        onChange={(e) =>
                          setCouponForm({
                            ...couponForm,
                            percent_off: e.target.value,
                            amount_off: "", // Clear amount_off when setting percent_off
                          })
                        }
                        placeholder="25"
                      />
                    </div>
                    <div>
                      <Label htmlFor="amount_off">Amount Off (in pence)</Label>
                      <Input
                        id="amount_off"
                        type="number"
                        min="0"
                        value={couponForm.amount_off}
                        onChange={(e) =>
                          setCouponForm({
                            ...couponForm,
                            amount_off: e.target.value,
                            percent_off: "", // Clear percent_off when setting amount_off
                          })
                        }
                        placeholder="2500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={couponForm.currency}
                        onValueChange={(value) => setCouponForm({ ...couponForm, currency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gbp">GBP (£)</SelectItem>
                          <SelectItem value="usd">USD ($)</SelectItem>
                          <SelectItem value="eur">EUR (€)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="duration">Duration</Label>
                      <Select
                        value={couponForm.duration}
                        onValueChange={(value) => setCouponForm({ ...couponForm, duration: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="once">Once</SelectItem>
                          <SelectItem value="repeating">Repeating</SelectItem>
                          <SelectItem value="forever">Forever</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {couponForm.duration === "repeating" && (
                    <div>
                      <Label htmlFor="duration_in_months">Duration in Months</Label>
                      <Input
                        id="duration_in_months"
                        type="number"
                        min="1"
                        value={couponForm.duration_in_months}
                        onChange={(e) => setCouponForm({ ...couponForm, duration_in_months: e.target.value })}
                        placeholder="3"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="max_redemptions">Max Redemptions</Label>
                      <Input
                        id="max_redemptions"
                        type="number"
                        min="1"
                        value={couponForm.max_redemptions}
                        onChange={(e) => setCouponForm({ ...couponForm, max_redemptions: e.target.value })}
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="redeem_by">Redeem By</Label>
                      <Input
                        id="redeem_by"
                        type="date"
                        value={couponForm.redeem_by}
                        onChange={(e) => setCouponForm({ ...couponForm, redeem_by: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCouponDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCoupon}>Create Coupon</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Coupons List */}
          <div className="grid gap-4">
            {couponsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading coupons...</p>
              </div>
            ) : filteredCoupons.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No coupons found</p>
                </CardContent>
              </Card>
            ) : (
              filteredCoupons.map((coupon) => (
                <Card key={coupon.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold">{coupon.name}</h3>
                          {getCouponStatusBadge(coupon)}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">ID:</span> {coupon.id}
                          </div>
                          <div>
                            <span className="font-medium">Discount:</span>{" "}
                            {coupon.percent_off ? (
                              <span className="text-green-600">{coupon.percent_off}% off</span>
                            ) : (
                              <span className="text-green-600">
                                {formatCurrency(coupon.amount_off, coupon.currency)} off
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="font-medium">Duration:</span> {coupon.duration}
                          </div>
                          <div>
                            <span className="font-medium">Redemptions:</span> {coupon.times_redeemed || 0}
                            {coupon.max_redemptions && ` / ${coupon.max_redemptions}`}
                          </div>
                        </div>
                        {coupon.redeem_by && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Expires:</span> {formatDate(coupon.redeem_by)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(coupon.id)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteCoupon(coupon.id)}>
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

        {/* Promotion Codes Tab */}
        <TabsContent value="promotion-codes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Promotion Codes</h2>
            <Dialog open={promotionCodeDialogOpen} onOpenChange={setPromotionCodeDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Promotion Code
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Promotion Code</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="coupon_id">Coupon *</Label>
                    <Select
                      value={promotionCodeForm.coupon_id}
                      onValueChange={(value) => setPromotionCodeForm({ ...promotionCodeForm, coupon_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a coupon" />
                      </SelectTrigger>
                      <SelectContent>
                        {coupons.map((coupon) => (
                          <SelectItem key={coupon.id} value={coupon.id}>
                            {coupon.name} ({coupon.id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="code">Code (optional)</Label>
                    <Input
                      id="code"
                      value={promotionCodeForm.code}
                      onChange={(e) => setPromotionCodeForm({ ...promotionCodeForm, code: e.target.value })}
                      placeholder="e.g., SAVE25 (auto-generated if empty)"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="max_redemptions">Max Redemptions</Label>
                      <Input
                        id="max_redemptions"
                        type="number"
                        min="1"
                        value={promotionCodeForm.max_redemptions}
                        onChange={(e) =>
                          setPromotionCodeForm({ ...promotionCodeForm, max_redemptions: e.target.value })
                        }
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="expires_at">Expires At</Label>
                      <Input
                        id="expires_at"
                        type="date"
                        value={promotionCodeForm.expires_at}
                        onChange={(e) => setPromotionCodeForm({ ...promotionCodeForm, expires_at: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Restrictions</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="first_time_transaction"
                        checked={promotionCodeForm.restrictions.first_time_transaction}
                        onChange={(e) =>
                          setPromotionCodeForm({
                            ...promotionCodeForm,
                            restrictions: {
                              ...promotionCodeForm.restrictions,
                              first_time_transaction: e.target.checked,
                            },
                          })
                        }
                      />
                      <Label htmlFor="first_time_transaction" className="text-sm">
                        First-time customers only
                      </Label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="minimum_amount">Minimum Amount (in pence)</Label>
                        <Input
                          id="minimum_amount"
                          type="number"
                          min="0"
                          value={promotionCodeForm.restrictions.minimum_amount}
                          onChange={(e) =>
                            setPromotionCodeForm({
                              ...promotionCodeForm,
                              restrictions: {
                                ...promotionCodeForm.restrictions,
                                minimum_amount: e.target.value,
                              },
                            })
                          }
                          placeholder="5000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="minimum_amount_currency">Currency</Label>
                        <Select
                          value={promotionCodeForm.restrictions.minimum_amount_currency}
                          onValueChange={(value) =>
                            setPromotionCodeForm({
                              ...promotionCodeForm,
                              restrictions: {
                                ...promotionCodeForm.restrictions,
                                minimum_amount_currency: value,
                              },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gbp">GBP (£)</SelectItem>
                            <SelectItem value="usd">USD ($)</SelectItem>
                            <SelectItem value="eur">EUR (€)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPromotionCodeDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePromotionCode}>Create Promotion Code</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Promotion Codes List */}
          <div className="grid gap-4">
            {promotionCodesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading promotion codes...</p>
              </div>
            ) : filteredPromotionCodes.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No promotion codes found</p>
                </CardContent>
              </Card>
            ) : (
              filteredPromotionCodes.map((promotionCode) => (
                <Card key={promotionCode.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold font-mono text-lg">{promotionCode.code}</h3>
                          {getPromotionCodeStatusBadge(promotionCode)}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Coupon:</span> {promotionCode.coupon?.name}
                          </div>
                          <div>
                            <span className="font-medium">Discount:</span>{" "}
                            {promotionCode.coupon?.percent_off ? (
                              <span className="text-green-600">{promotionCode.coupon.percent_off}% off</span>
                            ) : (
                              <span className="text-green-600">
                                {formatCurrency(promotionCode.coupon?.amount_off, promotionCode.coupon?.currency)} off
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="font-medium">Redemptions:</span> {promotionCode.times_redeemed || 0}
                            {promotionCode.max_redemptions && ` / ${promotionCode.max_redemptions}`}
                          </div>
                          <div>
                            <span className="font-medium">Expires:</span>{" "}
                            {promotionCode.expires_at ? formatDate(promotionCode.expires_at) : "Never"}
                          </div>
                        </div>
                        {promotionCode.restrictions && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Restrictions:</span>{" "}
                            {promotionCode.restrictions.first_time_transaction && "First-time customers only"}
                            {promotionCode.restrictions.minimum_amount &&
                              `, Min: ${formatCurrency(
                                promotionCode.restrictions.minimum_amount,
                                promotionCode.restrictions.minimum_amount_currency
                              )}`}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(promotionCode.code)}>
                          <Copy className="h-4 w-4" />
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

"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { THEME } from "@/theme";

export default function AdminFeedbackPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [type, setType] = useState("");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  // const { isLoaded, isSignedIn, user } = useUser();
  // const [username, setUsername] = useState("");

  // useEffect(() => {
  //   if (isLoaded && isSignedIn && user) {
  //     setUsername(user.username || "");
  //   }
  // }, [isLoaded, user, isSignedIn]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
      if (type) params.set('type', type);
      if (query) params.set('query', query);
      const res = await fetch(`/api/admin/feedback?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.items || []);
        setTotal(json.total || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [type, query, limit, offset]);

  const onDelete = async (id) => {
    if (!confirm('Delete this feedback?')) return;
    const res = await fetch(`/api/admin/feedback?id=${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) fetchData();
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <SidebarInset className='text-black'>
      {/* HEADER */}
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 bg-white">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-xl font-semibold" style={{ color: THEME.neutral900 }}>
            Feedbacks
          </h1>
        </div>

        {/* Profile Section
        <div className="ml-auto flex items-center gap-4 px-4">
          <div className="flex items-center gap-3">
            <UserButton />
            <span className="text-sm font-medium" style={{ color: THEME.neutral900 }}>
              {username}
            </span>
          </div>
        </div> */}
      </header>
      <div className="p-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Feedback Moderation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue placeholder="All types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="report">Reports</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Search feedback text" value={query} onChange={(e) => setQuery(e.target.value)} />
              <div />
            </div>

            <div className="space-y-3">
              {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
              {!loading && items.length === 0 && <div className="text-sm text-muted-foreground">No feedback found.</div>}
              {!loading && items.map((fb) => (
                <div key={fb.id} className="border rounded p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={fb.type === 'report' ? 'destructive' : 'secondary'}>{fb.type}</Badge>
                      {fb.questionId && <span className="text-xs text-muted-foreground">Q#{fb.questionId}</span>}
                      <span className="text-xs text-muted-foreground">{new Date(fb.createdAt).toLocaleString()}</span>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => onDelete(fb.id)}>Delete</Button>
                  </div>
                  <div className="mt-2 text-sm whitespace-pre-line">{fb.feedback}</div>
                  {fb.screenshot && (
                    <div className="mt-2">
                      <img
                        src={fb.screenshot}
                        alt="Screenshot"
                        className="max-w-xs max-h-32 object-contain border rounded cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setSelectedImage(fb.screenshot)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="text-xs text-muted-foreground">Showing {Math.min(offset + 1, total)} to {Math.min(offset + limit, total)} of {total}</div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setOffset((p) => Math.max(0, p - limit))}>Prev</Button>
                <div className="px-2 py-1 border rounded text-xs">Page {currentPage} of {totalPages}</div>
                <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setOffset((p) => p + limit)}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Image Modal */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>Screenshot</DialogTitle>
            </DialogHeader>
            <div className="p-6 pt-0 flex justify-center">
              {selectedImage && (
                <img
                  src={selectedImage}
                  alt="Screenshot"
                  className="max-w-full max-h-[70vh] object-contain rounded"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarInset>
  );
}



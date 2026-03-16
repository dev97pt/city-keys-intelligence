import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Shield } from "lucide-react";

// Admin check
function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").then(({ data }) => {
      setIsAdmin(data && data.length > 0 ? true : false);
    });
  }, [user]);
  return isAdmin;
}

// Generic CRUD component
function AdminCRUD<T extends { id: string }>({
  table,
  columns,
  fields,
}: {
  table: string;
  columns: { key: string; label: string }[];
  fields: { key: string; label: string; type?: string; options?: { value: string; label: string }[] }[];
}) {
  const { toast } = useToast();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const fetchItems = async () => {
    const { data } = await supabase.from(table).select("*").order("created_at", { ascending: false });
    setItems((data as T[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleCreate = async () => {
    const { error } = await supabase.from(table).insert(formData as any);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      setFormData({});
      setDialogOpen(false);
      fetchItems();
      toast({ title: "Created successfully" });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      fetchItems();
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              {fields.map((f) => (
                <div key={f.key}>
                  <Label>{f.label}</Label>
                  {f.options ? (
                    <select
                      value={formData[f.key] || ""}
                      onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select…</option>
                      {f.options.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : f.type === "textarea" ? (
                    <Textarea
                      value={formData[f.key] || ""}
                      onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <Input
                      type={f.type || "text"}
                      value={formData[f.key] || ""}
                      onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                      className="mt-1"
                    />
                  )}
                </div>
              ))}
              <Button onClick={handleCreate} className="w-full bg-primary text-primary-foreground">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">No items yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                {columns.map((c) => (
                  <th key={c.key} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{c.label}</th>
                ))}
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border/50">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3 text-foreground">
                      {String((item as any)[c.key] ?? "—")}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminPanel() {
  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 font-serif text-2xl font-semibold text-foreground">Admin Access Required</h1>
          <p className="mt-2 text-sm text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-serif text-3xl font-semibold text-foreground">Admin Panel</h1>
      <p className="mt-2 text-sm text-muted-foreground">Manage platform content and members.</p>

      <Tabs defaultValue="experiences" className="mt-8">
        <TabsList className="bg-secondary">
          <TabsTrigger value="experiences">Experiences</TabsTrigger>
          <TabsTrigger value="city-papers">City Papers</TabsTrigger>
          <TabsTrigger value="partners">Partners</TabsTrigger>
          <TabsTrigger value="webinars">Webinars</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="experiences" className="mt-6">
          <AdminCRUD
            table="experiences"
            columns={[
              { key: "title", label: "Title" },
              { key: "type", label: "Type" },
              { key: "price", label: "Price" },
              { key: "capacity", label: "Capacity" },
              { key: "date_start", label: "Start" },
            ]}
            fields={[
              { key: "title", label: "Title" },
              { key: "type", label: "Type", options: [{ value: "explorer", label: "Explorer" }, { value: "builder", label: "Builder" }] },
              { key: "description", label: "Description", type: "textarea" },
              { key: "price", label: "Price (€)", type: "number" },
              { key: "capacity", label: "Capacity", type: "number" },
              { key: "date_start", label: "Start Date", type: "date" },
              { key: "date_end", label: "End Date", type: "date" },
              { key: "country_id", label: "Country ID" },
            ]}
          />
        </TabsContent>

        <TabsContent value="city-papers" className="mt-6">
          <AdminCRUD
            table="city_papers"
            columns={[
              { key: "title", label: "Title" },
              { key: "created_at", label: "Created" },
            ]}
            fields={[
              { key: "title", label: "Title" },
              { key: "content_markdown", label: "Content", type: "textarea" },
              { key: "pdf_url", label: "PDF URL" },
              { key: "country_id", label: "Country ID" },
              { key: "city_id", label: "City ID" },
            ]}
          />
        </TabsContent>

        <TabsContent value="partners" className="mt-6">
          <AdminCRUD
            table="partners"
            columns={[
              { key: "name", label: "Name" },
              { key: "category", label: "Category" },
              { key: "contact_email", label: "Email" },
            ]}
            fields={[
              { key: "name", label: "Name" },
              { key: "category", label: "Category", options: [
                { value: "lawyers", label: "Lawyers" },
                { value: "accountants", label: "Accountants" },
                { value: "mortgage_brokers", label: "Mortgage Brokers" },
                { value: "real_estate_agents", label: "Real Estate Agents" },
                { value: "relocation_services", label: "Relocation Services" },
                { value: "tax_advisors", label: "Tax Advisors" },
              ] },
              { key: "description", label: "Description", type: "textarea" },
              { key: "website", label: "Website" },
              { key: "contact_email", label: "Email" },
              { key: "country_id", label: "Country ID" },
            ]}
          />
        </TabsContent>

        <TabsContent value="webinars" className="mt-6">
          <AdminCRUD
            table="webinars"
            columns={[
              { key: "title", label: "Title" },
              { key: "created_at", label: "Created" },
            ]}
            fields={[
              { key: "title", label: "Title" },
              { key: "description", label: "Description", type: "textarea" },
              { key: "video_url", label: "Video URL" },
              { key: "thumbnail", label: "Thumbnail URL" },
            ]}
          />
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          <AdminCRUD
            table="resources"
            columns={[
              { key: "title", label: "Title" },
              { key: "category", label: "Category" },
            ]}
            fields={[
              { key: "title", label: "Title" },
              { key: "description", label: "Description", type: "textarea" },
              { key: "file_url", label: "File URL" },
              { key: "category", label: "Category", options: [
                { value: "checklist", label: "Checklist" },
                { value: "template", label: "Template" },
                { value: "guide", label: "Guide" },
                { value: "budget", label: "Budget" },
              ] },
            ]}
          />
        </TabsContent>

        <TabsContent value="bookings" className="mt-6">
          <AdminCRUD
            table="bookings"
            columns={[
              { key: "user_id", label: "User" },
              { key: "experience_id", label: "Experience" },
              { key: "payment_status", label: "Payment" },
              { key: "booking_status", label: "Status" },
              { key: "created_at", label: "Date" },
            ]}
            fields={[]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

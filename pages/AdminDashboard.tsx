"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Briefcase,
  FolderOpen,
  Star,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
} from "lucide-react";
import api from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminSimpleServiceForm } from "@/components/services/AdminSimpleServiceForm";
import { useToast } from "@/hooks/use-toast";

export async function getServerSideProps() {
  return { props: {} };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProviders: 0,
    totalServices: 0,
    totalCategories: 0,
    pendingReviews: 0,
    activeUsers: 0,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [addServiceDialogOpen, setAddServiceDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch stats
      const [usersRes, servicesRes, categoriesRes] = await Promise.all([
        api.providers.getAll(),
        api.services.getAll({ limit: 1000 }), // Get all services for admin
        api.categories.getAll(true, { includeSubcategories: true }),
      ]);

      if (usersRes.success && usersRes.data) {
        const providers = (usersRes.data as { providers?: unknown[] })?.providers || [];
        setUsers(providers);
        setStats((prev) => ({
          ...prev,
          totalProviders: providers.length || 0,
        }));
      }

      const servicesData = servicesRes.data as { services?: unknown[]; pagination?: { total?: number } } | undefined;
      if (servicesRes.success && servicesData) {
        setServices((servicesData.services || []) as any[]);
        setStats((prev) => ({
          ...prev,
          totalServices: servicesData.pagination?.total || 0,
        }));
      }

      const categoriesData = categoriesRes.data as { categories?: unknown[] } | undefined;
      if (categoriesRes.success && categoriesData) {
        setCategories((categoriesData.categories || []) as any[]);
        setStats((prev) => ({
          ...prev,
          totalCategories: categoriesData.categories?.length || 0,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    
    try {
      const response = await api.services.delete(serviceId);
      if (response.success) {
        setServices(services.filter((s) => s._id !== serviceId));
      }
    } catch (error) {
      console.error("Failed to delete service:", error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    
    try {
      // Note: Category delete API needs to be implemented in backend
      alert("Category deletion will be implemented");
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  };

  const handleServiceSuccess = () => {
    fetchDashboardData();
    setAddServiceDialogOpen(false);
    toast({
      title: "Success",
      description: "Service added successfully",
    });
  };

  return (
    <DashboardLayout type="admin">
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage users, services, categories, and platform settings
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            Admin Access
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Active users on platform
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Providers</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProviders}</div>
              <p className="text-xs text-muted-foreground">
                Registered service providers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Services</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalServices}</div>
              <p className="text-xs text-muted-foreground">
                Total services listed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCategories}</div>
              <p className="text-xs text-muted-foreground">
                Service categories
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different management sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Services</CardTitle>
                  <CardDescription>Latest services added to platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {services.slice(0, 5).map((service) => (
                      <div
                        key={service._id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div>
                          <p className="font-medium">{service.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {service.category?.name || "Uncategorized"}
                          </p>
                        </div>
                        <Badge variant={service.isActive ? "default" : "secondary"}>
                          {service.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common admin tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link href="/dashboard/admin/categories/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Category
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link href="/dashboard/admin/users">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Users
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link href="/dashboard/admin/services">
                      <Briefcase className="mr-2 h-4 w-4" />
                      Manage Services
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Services</CardTitle>
                    <CardDescription>Manage all services on the platform</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Search services..." className="w-64" />
                    <Button 
                      variant="outline" 
                      size="icon"
                      aria-label="Search services"
                      title="Search services"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => setAddServiceDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Service
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          Loading services...
                        </TableCell>
                      </TableRow>
                    ) : services.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          No services found
                        </TableCell>
                      </TableRow>
                    ) : (
                      services.map((service) => (
                        <TableRow key={service._id}>
                          <TableCell className="font-medium">{service.title}</TableCell>
                          <TableCell>{service.category?.name || "N/A"}</TableCell>
                          <TableCell>
                            {service.provider?.name || 
                             (typeof service.provider === 'object' && service.provider ? service.provider.name : "N/A") ||
                             "N/A"}
                          </TableCell>
                          <TableCell>₹{service.price}</TableCell>
                          <TableCell>
                            <Badge variant={service.isActive ? "default" : "secondary"}>
                              {service.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                aria-label={`Edit ${service.title}`}
                                title={`Edit ${service.title}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteService(service._id)}
                                aria-label={`Delete ${service.title}`}
                                title={`Delete ${service.title}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Categories</CardTitle>
                    <CardDescription>Manage service categories</CardDescription>
                  </div>
                  <Button asChild>
                    <Link href="/dashboard/admin/categories/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Category
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categories.map((category) => (
                    <Card key={category._id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          <Badge>{category.count || 0} services</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {category.subcategories?.length || 0} subcategories
                        </p>
                        {category.subcategories && category.subcategories.length > 0 ? (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {category.subcategories.slice(0, 6).map((subcat: string, index: number) => (
                              <Badge key={`${category._id}-sub-${index}`} variant="secondary">
                                {subcat}
                              </Badge>
                            ))}
                            {category.subcategories.length > 6 && (
                              <span className="text-xs text-muted-foreground">
                                +{category.subcategories.length - 6} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mb-4">No subcategories</p>
                        )}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCategory(category._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage all platform users</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  User management interface will be implemented here
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Review Management</CardTitle>
                <CardDescription>Moderate and manage reviews</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Review management interface will be implemented here
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Service Dialog - Simple Form */}
        <AdminSimpleServiceForm
          open={addServiceDialogOpen}
          onOpenChange={setAddServiceDialogOpen}
          categories={categories}
          availableUsers={users}
          onSuccess={handleServiceSuccess}
        />
      </div>
    </DashboardLayout>
  );
}

































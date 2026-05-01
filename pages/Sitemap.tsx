"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Home, Info, CreditCard, FileText, UserPlus, Map, MapPin } from "lucide-react";
import { CITIES } from "@/constants/cities";

interface SitemapSection {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  links: {
    label: string;
    path: string;
    description?: string;
  }[];
}

const sitemapSections: SitemapSection[] = [
  {
    title: "Main Pages",
    icon: Home,
    links: [
      { label: "Home", path: "/", description: "Discover services and providers" },
      { label: "Browse Services", path: "/services", description: "Find services by category and location" },
      { label: "Pricing", path: "/pricing", description: "View subscription plans and pricing" },
    ],
  },
  {
    title: "About & Information",
    icon: Info,
    links: [
      { label: "About Us", path: "/about", description: "Learn about Imagineering India" },
      { label: "Contact Us", path: "/contact", description: "Get in touch with our team" },
      { label: "Help Center", path: "/help", description: "Find answers to common questions" },
      { label: "Community", path: "/community", description: "Join our community" },
    ],
  },
  {
    title: "Subscriptions",
    icon: CreditCard,
    links: [
      { label: "Subscriptions Overview", path: "/subscriptions", description: "View all subscription options" },
      { label: "Buyer Subscriptions", path: "/subscriptions/buyer", description: "Subscription plans for buyers" },
      { label: "Supplier Subscriptions", path: "/subscriptions/supplier", description: "Subscription plans for suppliers" },
    ],
  },
  {
    title: "Account",
    icon: UserPlus,
    links: [
      { label: "Login", path: "/login", description: "Sign in to your account" },
      { label: "Sign Up", path: "/signup", description: "Create a new account" },
      { label: "Forgot Password", path: "/forgot-password", description: "Reset your password" },
    ],
  },
  {
    title: "Legal",
    icon: FileText,
    links: [
      { label: "Privacy Policy", path: "/privacy", description: "Our privacy policy" },
      { label: "Terms of Service", path: "/terms", description: "Terms and conditions" },
    ],
  },
  {
    title: "City Pages",
    icon: MapPin,
    links: CITIES.map((c) => ({
      label: `Services in ${c.name}`,
      path: `/${c.slug}`,
      description: `Contractors & local services in ${c.name}`,
    })),
  },
];

export default function Sitemap() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-primary/5 via-background to-primary/5">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
                Site Map
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
                Navigate through all pages and sections of Imagineering India
              </p>
            </div>
          </div>
        </section>

        {/* Sitemap Content */}
        <section className="py-8 sm:py-12 md:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
              {sitemapSections.map((section, index) => {
                const Icon = section.icon;
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg sm:text-xl">{section.title}</CardTitle>
                      </div>
                      <CardDescription>
                        {section.links.length} {section.links.length === 1 ? 'page' : 'pages'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {section.links.map((link, linkIndex) => (
                          <li key={linkIndex}>
                            <Link
                              href={link.path}
                              className="group flex flex-col gap-1 p-2 rounded-md hover:bg-accent transition-colors"
                            >
                              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                {link.label}
                              </span>
                              {link.description && (
                                <span className="text-xs text-muted-foreground">
                                  {link.description}
                                </span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Additional Info */}
            <div className="mt-12 max-w-3xl mx-auto">
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Map className="h-5 w-5" />
                    Quick Links
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">For Buyers</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Browse and book services</li>
                        <li>• View provider profiles</li>
                        <li>• Manage orders and favorites</li>
                        <li>• Subscribe for benefits</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2">For Providers</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• List your services</li>
                        <li>• Manage bookings and leads</li>
                        <li>• Track earnings</li>
                        <li>• Complete KYC verification</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}


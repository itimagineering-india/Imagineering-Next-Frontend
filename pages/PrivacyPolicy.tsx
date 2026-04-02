"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Shield,
  Lock,
  Eye,
  Bell,
  Globe,
  Database,
  Timer,
  Mail,
} from "lucide-react";

export async function getServerSideProps() { return { props: {} }; }

const dataCollected = [
  {
    icon: Eye,
    title: "Information you provide",
    items: [
      "Account details such as name, email, phone, and business info",
      "Service preferences, search queries, and submitted forms",
      "Messages, reviews, and content you share on the platform",
    ],
  },
  {
    icon: Globe,
    title: "Automatic data",
    items: [
      "Device info, browser type, IP address, and approximate location",
      "Usage analytics like pages viewed, clicks, and time on site",
      "Cookies and similar technologies that remember your preferences",
    ],
  },
  {
    icon: Database,
    title: "Third-party data",
    items: [
      "Verification partners for identity or business credentials",
      "Payment processors for billing and transaction confirmation",
      "Communication tools that help deliver notifications and support",
    ],
  },
];

const usageReasons = [
  "Provide, personalize, and improve our services and listings",
  "Process payments, subscriptions, and provider verifications",
  "Enable messaging, notifications, and support responses",
  "Monitor safety, prevent fraud, and enforce platform policies",
  "Analyze trends to enhance performance and user experience",
  "Comply with legal obligations and respond to lawful requests",
];

const sharingRules = [
  "Service providers and buyers when you choose to connect or book",
  "Trusted vendors like payment processors and analytics partners",
  "Authorities or regulators when required by law or to protect safety",
  "In corporate transactions such as mergers or acquisitions",
];

const userChoices = [
  "Update account details from your profile at any time",
  "Manage marketing preferences via email links or settings",
  "Control cookies through your browser or device settings",
  "Request access, correction, or deletion where applicable",
];

const securityPractices = [
  "Encryption in transit, access controls, and monitoring",
  "Role-based permissions for internal access to your data",
  "Vendor reviews to ensure appropriate safeguards",
  "Ongoing improvements to detect and prevent misuse",
];

const retentionNotes = [
  "We keep data only as long as needed for services and legal reasons",
  "Retention periods may vary for billing, compliance, and dispute handling",
  "When data is no longer required, we delete or de-identify it",
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col">

      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-primary/5 via-background to-primary/5 border-b">
          <div className="container max-w-5xl">
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Shield className="h-4 w-4" />
                Privacy & Policy
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Your Data. Protected with Purpose.
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                We built Imagineering India to make finding trusted services simple and safe.
                This page explains what we collect, how we use it, and the choices you have.
              </p>
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
        </section>

        {/* Data we collect */}
        <section className="py-14">
          <div className="container max-w-6xl">
            <div className="mb-8">
              <h2 className="text-3xl font-semibold text-foreground mb-2">Information We Collect</h2>
              <p className="text-muted-foreground max-w-3xl">
                We collect information to operate our platform, tailor results, and keep your experience secure.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {dataCollected.map((group) => (
                <Card key={group.title} className="h-full border-0 shadow-sm">
                  <CardHeader className="space-y-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <group.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">{group.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    {group.items.map((item) => (
                      <div key={item} className="flex gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-primary/70" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Mobile permissions */}
        <section className="py-14 bg-secondary/30">
          <div className="container max-w-6xl space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold text-foreground">Mobile App Permissions</h2>
              <p className="text-muted-foreground max-w-3xl">
                When you use our Imagineering India mobile app, we may request certain permissions from your device to enable core features.
                You can review or revoke these permissions in your device settings at any time.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Location (Approximate / Precise)</h3>
                <p className="text-sm text-muted-foreground">
                  Used to show services and providers near you, improve search relevance, and help display distances/availability.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Camera</h3>
                <p className="text-sm text-muted-foreground">
                  Used when you choose to take photos for profile updates and verification (KYC).
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Photos / Media Library (Storage)</h3>
                <p className="text-sm text-muted-foreground">
                  Used to select and upload images/documents for profile, verification (KYC), and receipts/related uploads.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Used to send booking updates, messages, and important alerts related to your account and requests.
                </p>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* How we use data */}
        <section className="py-14 bg-secondary/30">
          <div className="container max-w-5xl space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold text-foreground">How We Use Your Information</h2>
              <p className="text-muted-foreground max-w-3xl">
                We use your data to deliver essential features, improve quality, and keep the platform trustworthy.
              </p>
            </div>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 grid gap-4 sm:grid-cols-2">
                {usageReasons.map((reason) => (
                  <div key={reason} className="flex gap-3">
                    <Lock className="h-4 w-4 text-primary mt-1" />
                    <p className="text-sm text-muted-foreground">{reason}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Sharing */}
        <section className="py-14">
          <div className="container max-w-5xl space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold text-foreground">When We Share Information</h2>
              <p className="text-muted-foreground max-w-3xl">
                We do not sell your personal data. We share it only when needed to run the platform or when legally required.
              </p>
            </div>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 space-y-3">
                {sharingRules.map((rule) => (
                  <div key={rule} className="flex gap-3">
                    <Bell className="h-4 w-4 text-primary mt-1" />
                    <p className="text-sm text-muted-foreground">{rule}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Your choices */}
        <section className="py-14 bg-secondary/30">
          <div className="container max-w-5xl space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold text-foreground">Your Rights & Choices</h2>
              <p className="text-muted-foreground max-w-3xl">
                You are in control of your information. Depending on your region, you may have additional rights.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {userChoices.map((choice) => (
                <Card key={choice} className="border-0 shadow-sm">
                  <CardContent className="p-5 flex gap-3 items-start">
                    <Shield className="h-5 w-5 text-primary mt-1" />
                    <p className="text-sm text-muted-foreground">{choice}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="py-14">
          <div className="container max-w-5xl space-y-10">
            <div className="grid gap-8 md:grid-cols-2">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2 text-primary">
                    <Lock className="h-5 w-5" />
                    <span className="text-sm font-semibold">Security</span>
                  </div>
                  <CardTitle className="text-2xl">How We Protect Your Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  {securityPractices.map((item) => (
                    <div key={item} className="flex gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary/70" />
                      <span>{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2 text-primary">
                    <Timer className="h-5 w-5" />
                    <span className="text-sm font-semibold">Retention</span>
                  </div>
                  <CardTitle className="text-2xl">How Long We Keep Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  {retentionNotes.map((item) => (
                    <div key={item} className="flex gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary/70" />
                      <span>{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <Separator />

        {/* Contact */}
        <section className="py-14 bg-gradient-to-br from-primary/5 via-background to-primary/5">
          <div className="container max-w-4xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Mail className="h-4 w-4" />
              Questions or Requests
            </div>
            <h3 className="text-3xl font-semibold text-foreground">Need to reach us?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              For questions about this policy, reach out to us anytime.
            </p>
            <Button asChild variant="secondary" className="mx-auto">
              <Link href="/contact">Contact us</Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              We may update this Privacy Policy periodically. We will post updates with a new effective date above.
            </p>
          </div>
        </section>
      </main>

    </div>
  );
}


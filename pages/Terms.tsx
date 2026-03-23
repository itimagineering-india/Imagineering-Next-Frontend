"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, BookOpen, CheckCircle, Shield, Globe2, Mail, Phone } from "lucide-react";

export async function getServerSideProps() { return { props: {} }; }

const sections = [
  {
    title: "Acceptance of Terms",
    points: [
      "By accessing or using Imagineering India, you agree to these Terms and our Privacy Policy.",
      "If you use the platform on behalf of an organization, you represent you have authority to bind it.",
      "If you do not agree, do not use the services.",
    ],
  },
  {
    title: "Use of the Platform",
    points: [
      "You will provide accurate account information and keep credentials secure.",
      "You are responsible for all activity under your account, including actions of authorized team members.",
      "We may contact you about service updates, security, and support.",
    ],
  },
  {
    title: "Providers & Buyers",
    points: [
      "Providers must ensure listings, licenses, and qualifications are accurate and compliant with local laws.",
      "Buyers are responsible for assessing suitability of providers and complying with applicable regulations.",
      "Reviews and ratings must be fair, honest, and based on real experiences.",
    ],
  },
  {
    title: "Payments & Fees",
    points: [
      "Certain services may incur fees; you agree to posted pricing and billing terms.",
      "Payment processing is handled by third-party processors; their terms apply in addition to ours.",
      "You authorize us to charge applicable fees, taxes, and adjustments where required.",
    ],
  },
  {
    title: "Content & IP",
    points: [
      "You retain rights to your content but grant us a license to host, display, and operate the service.",
      "You will not upload unlawful, infringing, or harmful material.",
      "We may remove content that violates these Terms or applicable law.",
    ],
  },
  {
    title: "Prohibited Conduct",
    points: [
      "No fraud, misrepresentation, scraping, or security circumvention.",
      "Do not upload malware or interfere with platform integrity or performance.",
      "Do not use the platform for unlawful activities or to harass, abuse, or violate others’ rights.",
    ],
  },
  {
    title: "Privacy",
    points: [
      "Your use is also governed by our Privacy Policy at /privacy.",
      "We use data to provide, secure, and improve the service.",
    ],
  },
  {
    title: "Disclaimers",
    points: [
      "Services are provided “as is” without warranties of any kind.",
      "We do not guarantee availability, specific outcomes, or that providers/buyers will meet expectations.",
    ],
  },
  {
    title: "Limitation of Liability",
    points: [
      "To the maximum extent permitted by law, we are not liable for indirect, incidental, or consequential damages.",
      "Our aggregate liability is limited to the amount you paid to us in the twelve months preceding the claim.",
    ],
  },
  {
    title: "Termination",
    points: [
      "We may suspend or terminate access for violations of these Terms or for security reasons.",
      "You may stop using the service at any time; certain obligations and rights survive termination.",
    ],
  },
  {
    title: "Changes to Terms",
    points: [
      "We may update these Terms; material changes will be posted with a new effective date.",
      "Continued use after updates means you accept the revised Terms.",
    ],
  },
  {
    title: "Governing Law & Disputes",
    points: [
      "These Terms are governed by applicable laws of India, without regard to conflicts principles.",
      "Disputes will be resolved in the courts located in India, unless otherwise required by law.",
    ],
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col">

      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-primary/5 via-background to-primary/5 border-b">
          <div className="container max-w-5xl">
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <BookOpen className="h-4 w-4" />
                Terms of Service
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Use Imagineering India Responsibly
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                These Terms explain your rights, responsibilities, and the rules for using our platform.
              </p>
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
        </section>

        {/* Key Notices */}
        <section className="py-12">
          <div className="container max-w-5xl grid gap-6 md:grid-cols-3">
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Trust & Safety</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Keep credentials secure, verify counterparties, and follow local laws when offering or purchasing services.
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">No Misuse</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Fraud, scraping, harassment, and security circumvention are prohibited and may result in suspension.
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Your Control</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Manage your account, preferences, and data rights. See our Privacy Policy for details.
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Detailed Terms */}
        <section className="py-14 bg-secondary/30">
          <div className="container max-w-6xl space-y-8">
            {sections.map((section) => (
              <Card key={section.title} className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl text-foreground">{section.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  {section.points.map((point) => (
                    <div key={point} className="flex gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary/70" />
                      <span>{point}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* Contact */}
        <section className="py-14 bg-gradient-to-br from-primary/5 via-background to-primary/5">
          <div className="container max-w-4xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Globe2 className="h-4 w-4" />
              Questions about these Terms?
            </div>
            <h3 className="text-3xl font-semibold text-foreground">We are here to help.</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Contact us if you have questions about these Terms or need to report a concern.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 justify-center">
                <Mail className="h-4 w-4 text-primary" />
                legal@imagineeringindia.com
              </div>
              <div className="flex items-center gap-2 justify-center">
                <Phone className="h-4 w-4 text-primary" />
                +91 98765 43210
              </div>
            </div>
          </div>
        </section>
      </main>

    </div>
  );
}


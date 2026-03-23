"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Facebook, Twitter, Linkedin, Instagram, Mail, Loader2, CheckCircle2, MapPin, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api-client";
import { CITIES } from "@/constants/cities";
import { useTranslation } from "react-i18next";

const footerLinkKeys = {
  forBuyers: [
    { key: "exploreServices" as const, href: "/services" },
    { key: "howItWorks" as const, href: "/about" },
    { key: "pricingPlans" as const, href: "/pricing" },
    { key: "caseStudies" as const, href: "/about" },
  ],
  forProviders: [
    { key: "registerAsProvider" as const, href: "/signup?type=provider" },
    { key: "providerGuidelines" as const, href: "/help" },
    { key: "providerNetwork" as const, href: "/community" },
    { key: "growthBestPractices" as const, href: "/help" },
  ],
  company: [
    { key: "aboutUs" as const, href: "/about" },
    { key: "careers" as const, href: "/careers" },
    { key: "press" as const, href: "/community" },
    { key: "contact" as const, href: "/contact" },
  ],
  support: [
    { key: "helpSupport" as const, href: "/help" },
    { key: "verificationSafety" as const, href: "/help" },
    { key: "sitemap" as const, href: "/sitemap" },
    { key: "termsConditions" as const, href: "/terms" },
    { key: "privacyPolicy" as const, href: "/privacy" },
  ],
};

const socialLinks = [
  { icon: Facebook, href: "https://www.facebook.com/share/1Ad3sc8WAL/", label: "Facebook" },
  //{ icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "https://www.linkedin.com/company/imagineeringindia", label: "LinkedIn" },
  { icon: Instagram, href: "https://www.instagram.com/imagineeringindia?igsh=ZTM4MjJxeDR5NGtx", label: "Instagram" },
];

interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
}

/** Convert to proper Title Case (e.g. "construction materials" → "Construction Materials") */
function toTitleCase(str: string): string {
  return str
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function Footer() {
  const { t } = useTranslation("footer");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    api.categories.getAll().then((res) => {
      if (res.success && (res.data as any)?.categories) {
        const list = (res.data as any).categories as CategoryItem[];
        setCategories(list.slice(0, 16));
      }
    }).catch(() => {});
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.newsletter.subscribe(email.trim());
      
      if (response.success) {
        setIsSubscribed(true);
        setEmail("");
        toast({
          title: "Successfully Subscribed!",
          description: (response as any)?.message || "You will receive updates and exclusive offers.",
        });
        
        // Reset success state after 3 seconds
        setTimeout(() => {
          setIsSubscribed(false);
        }, 3000);
      } else {
        toast({
          title: "Subscription Failed",
          description: response.error?.message || "Please try again later",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Newsletter subscription error:", error);
      toast({
        title: "Subscription Failed",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <footer className="bg-secondary/50 border-t min-h-[400px] normal-case">
      <div className="container py-6 md:py-8 lg:py-12 px-4 md:px-6">
        {/* Newsletter Section */}
        <div className="mb-6 md:mb-8 lg:mb-12 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 rounded-lg md:rounded-xl bg-primary p-4 md:p-6 lg:p-8">
          <div className="text-center md:text-left w-full md:w-auto">
            <h3 className="text-base md:text-lg lg:text-xl font-semibold text-primary-foreground">{t("stayUpdated")}</h3>
            <p className="mt-1 text-xs md:text-sm text-primary-foreground/80">{t("newsletterDesc")}</p>
          </div>
          <form onSubmit={handleSubscribe} className="flex w-full md:w-auto gap-2">
            <Input
              type="email"
              placeholder={t("enterEmail")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || isSubscribed}
              className="w-full md:w-56 lg:w-64 bg-primary-foreground border-0 text-xs md:text-sm h-9 md:h-10"
              required
            />
            <Button 
              type="submit"
              variant="secondary" 
              size="sm" 
              disabled={isLoading || isSubscribed}
              className="text-xs md:text-sm h-9 md:h-10 whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-1.5 md:mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
                  <span className="hidden sm:inline">Subscribing...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : isSubscribed ? (
                <>
                  <CheckCircle2 className="mr-1.5 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Subscribed!</span>
                  <span className="sm:hidden">Done</span>
                </>
              ) : (
                <>
                  <Mail className="mr-1.5 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">{t("subscribe")}</span>
                  <span className="sm:hidden">Subscribe</span>
                </>
              )}
            </Button>
          </form>
        </div>

        {/* SEO: Keyword-rich intro + internal links */}
        <section className="mb-6 md:mb-8" aria-label="Services and locations">
          <p className="text-xs md:text-sm text-muted-foreground max-w-4xl mb-4 md:mb-6 leading-relaxed">
            One stop for local construction services, contractors, and vendors across India — find plumbing, electrical, painting, carpentry, HVAC, interior design, and more. We help you discover verified service providers in Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Pune, Kolkata, and other cities. Book services, compare quotes, and manage projects from a single platform.
          </p>
          <div className="flex flex-col gap-4 md:gap-6">
            {categories.length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground mb-2 text-sm flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" />
                  {t("popularCategories")}
                </h4>
                <ul className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs md:text-sm text-muted-foreground">
                  {categories.map((cat, i) => (
                    <li key={cat._id} className="inline-flex items-center gap-1.5">
                      <Link href={`/services?category=${encodeURIComponent(cat.slug)}`} className="hover:text-primary transition-colors">
                        {toTitleCase(cat.name)}
                      </Link>
                      {i < categories.length - 1 && <span className="text-muted-foreground/60" aria-hidden> | </span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <h4 className="font-semibold text-foreground mb-2 text-sm flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {t("popularCities")}
              </h4>
              <ul className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs md:text-sm text-muted-foreground">
                {CITIES.map((city, i) => (
                  <li key={city.slug} className="inline-flex items-center gap-1.5">
                    <Link href={`/${city.slug}`} className="hover:text-primary transition-colors">
                      {toTitleCase(city.name)}
                    </Link>
                    {i < CITIES.length - 1 && <span className="text-muted-foreground/60" aria-hidden> | </span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <Separator className="mb-4 md:mb-6" />

        {/* Links Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 lg:gap-8 mb-6 md:mb-8 lg:mb-12">
          <div>
            <h4 className="font-semibold text-foreground mb-2 md:mb-3 lg:mb-4 text-sm md:text-base">{t("forBuyers")}</h4>
            <ul className="space-y-1.5 md:space-y-2 lg:space-y-3">
              {footerLinkKeys.forBuyers.map((link) => (
                <li key={link.key}>
                  <Link href={link.href} className="text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors">
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2 md:mb-3 lg:mb-4 text-sm md:text-base">{t("forProviders")}</h4>
            <ul className="space-y-1.5 md:space-y-2 lg:space-y-3">
              {footerLinkKeys.forProviders.map((link) => (
                <li key={link.key}>
                  <Link href={link.href} className="text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors">
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2 md:mb-3 lg:mb-4 text-sm md:text-base">{t("company")}</h4>
            <ul className="space-y-1.5 md:space-y-2 lg:space-y-3">
              {footerLinkKeys.company.map((link) => (
                <li key={link.key}>
                  <Link href={link.href} className="text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors">
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2 md:mb-3 lg:mb-4 text-sm md:text-base">{t("support")}</h4>
            <ul className="space-y-1.5 md:space-y-2 lg:space-y-3">
              {footerLinkKeys.support.map((link) => (
                <li key={link.key}>
                  <Link href={link.href} className="text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors">
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="mb-4 md:mb-6 lg:mb-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-2">
            <img 
              src="https://dwkazjggpovin.cloudfront.net/imagineeringLogoRBG.png" 
              alt="Imagineering India Logo" 
              className="h-8 w-8 md:h-10 md:w-10 object-contain shrink-0"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-base md:text-lg lg:text-xl font-bold text-foreground">
                Imagineering India
              </span>
              <span className="text-xs md:text-sm text-muted-foreground">
                Integrated Construction Solutions Platform
              </span>
            </div>
          </div>

          <p className="text-[10px] md:text-xs lg:text-sm text-muted-foreground text-center md:text-left order-3 md:order-2">
            © {new Date().getFullYear()} Imagineering Construct Pvt. Ltd. {t("allRightsReserved")}
          </p>

          <div className="flex items-center gap-3 md:gap-4 order-2 md:order-3">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <social.icon className="h-4 w-4 md:h-5 md:w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

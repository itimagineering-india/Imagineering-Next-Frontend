"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  CreditCard,
  Users,
  Shield,
  Settings,
  FileText,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { faqItems } from "@/data/mockData";

export async function getServerSideProps() { return { props: {} }; }

const helpCategories = [
  {
    icon: Users,
    title: "Getting Started",
    description: "Learn the basics of using ServiceHub",
    articles: 12,
    href: "#getting-started",
  },
  {
    icon: CreditCard,
    title: "Billing & Payments",
    description: "Manage your payments and subscriptions",
    articles: 8,
    href: "#billing",
  },
  {
    icon: Shield,
    title: "Trust & Safety",
    description: "Stay safe and secure on our platform",
    articles: 10,
    href: "#safety",
  },
  {
    icon: Settings,
    title: "Account Settings",
    description: "Manage your account and preferences",
    articles: 6,
    href: "#settings",
  },
  {
    icon: FileText,
    title: "For Providers",
    description: "Tips and guides for service providers",
    articles: 15,
    href: "#providers",
  },
  {
    icon: MessageSquare,
    title: "Communication",
    description: "Using messages and notifications",
    articles: 5,
    href: "#communication",
  },
];

const popularArticles = [
  { title: "How to create your first service listing", category: "Providers" },
  { title: "Understanding our escrow payment system", category: "Payments" },
  { title: "How to leave a review for a provider", category: "Getting Started" },
  { title: "Upgrading to a premium subscription", category: "Billing" },
  { title: "Reporting inappropriate behavior", category: "Safety" },
  { title: "How to contact providers directly", category: "Premium" },
];

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen flex flex-col">

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-10 sm:py-12 md:py-16 lg:py-24 bg-gradient-to-br from-primary/5 via-background to-primary/5">
          <div className="container px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                How Can We Help?
              </h1>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-muted-foreground">
                Search our knowledge base or browse categories below
              </p>
              <div className="mt-6 sm:mt-8 max-w-xl mx-auto relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 sm:h-12 md:h-14 pl-10 sm:pl-12 text-sm sm:text-base"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-8 sm:py-10 md:py-12">
          <div className="container px-4 sm:px-6">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 sm:mb-8 text-center">
              Browse by Category
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 max-w-5xl mx-auto">
              {helpCategories.map((category, index) => (
                <Card
                  key={category.title}
                  className="group hover:shadow-lg transition-all duration-300 animate-fade-in cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="pt-4 sm:pt-5 md:pt-6 p-4 sm:p-5 md:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex-shrink-0">
                        <category.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors">
                          {category.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          {category.description}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2">
                          {category.articles} articles
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Articles */}
        <section className="py-8 sm:py-10 md:py-12 bg-secondary/30">
          <div className="container px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 sm:mb-8 text-center">
                Popular Articles
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {popularArticles.map((article) => (
                  <Card
                    key={article.title}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base text-foreground">
                          {article.title}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                          {article.category}
                        </p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-10 sm:py-12 md:py-16">
          <div className="container px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 sm:mb-8 text-center">
                Frequently Asked Questions
              </h2>
              <Accordion type="single" collapsible className="space-y-3 sm:space-y-4">
                {faqItems.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="bg-card border rounded-lg px-3 sm:px-4 md:px-6"
                  >
                    <AccordionTrigger className="text-left hover:no-underline text-sm sm:text-base pr-4">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs sm:text-sm text-muted-foreground pr-4">
                      {item.bullets?.length ? (
                        <div>
                          {item.answerIntro ? (
                            <p className="mb-3 text-foreground/90">{item.answerIntro}</p>
                          ) : null}
                          <ul className="list-inside list-disc space-y-2">
                            {item.bullets.map((line) => (
                              <li key={line}>{line}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        item.answer
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-10 sm:py-12 md:py-16 bg-primary">
          <div className="container px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground">
                Still Need Help?
              </h2>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-primary-foreground/80">
                Our support team is here to assist you with any questions or
                concerns.
              </p>
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Button size="lg" variant="secondary" asChild className="w-full sm:w-auto text-sm sm:text-base h-10 sm:h-11">
                  <Link href="/contact">Contact Support</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 w-full sm:w-auto text-sm sm:text-base h-10 sm:h-11"
                >
                  <MessageSquare className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Start Live Chat
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

    </div>
  );
}

"use client";

import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CitySeoContent } from "@/constants/citySeoContent";

interface CitySeoSectionsProps {
  content: CitySeoContent;
}

export function CitySeoSections({ content }: CitySeoSectionsProps) {
  return (
    <div className="border-t bg-muted/20">
      <div className="container px-4 md:px-6 lg:px-8 py-8 md:py-12 lg:py-16 space-y-10 md:space-y-14">
        {/* Static SEO Content */}
        {content.staticContent.map((section, idx) => (
          <section key={idx} className="space-y-3">
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">
              {section.heading}
            </h2>
            <div className="prose prose-sm md:prose-base text-muted-foreground max-w-none space-y-2">
              {Array.isArray(section.content) ? (
                section.content.map((para, i) => (
                  <p key={i} className="leading-relaxed">
                    {para}
                  </p>
                ))
              ) : (
                <p>{section.content}</p>
              )}
            </div>
          </section>
        ))}

        {/* Internal Linking */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">
            Explore Construction Categories in Bhopal
          </h2>
          <div className="flex flex-wrap gap-2">
            {content.internalLinks.map((link, idx) => (
              <Link key={idx} href={link.href}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  {link.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">
            Frequently Asked Questions (FAQs)
          </h2>
          <Accordion type="single" collapsible defaultValue="faq-0" className="rounded-lg border">
            {content.faq.map((item, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`} className="px-4">
                <AccordionTrigger className="text-left hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* CTA */}
        <section className="rounded-xl border bg-primary/5 p-6 md:p-8 text-center space-y-4">
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">
            {content.cta.heading}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {content.cta.description}
          </p>
          <p className="text-sm font-medium">
            👉 {content.cta.buttonText}
          </p>
        </section>
      </div>
    </div>
  );
}

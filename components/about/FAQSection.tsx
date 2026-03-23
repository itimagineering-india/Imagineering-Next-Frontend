"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const faqs = [
  {
    question: "How do I find service providers near me?",
    answer: "Simply enter your location or postal code in the search bar, select a service category, and browse verified providers on our interactive map. You can filter results by distance, ratings, and availability.",
  },
  {
    question: "Are all providers verified?",
    answer: "Yes, all providers on our platform undergo a thorough verification process. We verify their business credentials, licenses (where applicable), and collect reviews from previous customers to ensure quality and reliability.",
  },
  {
    question: "How do I contact a service provider?",
    answer: "You can contact providers directly through our platform. Premium members get direct contact information, while standard users can send messages through our secure messaging system. Some providers also offer instant booking options.",
  },
  {
    question: "Is there a fee to use the platform?",
    answer: "Searching and browsing providers is completely free. We offer both free and premium membership options. Premium members get additional benefits like direct contact information, priority support, and exclusive deals.",
  },
  {
    question: "What if I'm not satisfied with a service?",
    answer: "We take customer satisfaction seriously. If you have concerns about a service provider, please contact our support team. We also encourage you to leave honest reviews to help other customers make informed decisions.",
  },
  {
    question: "Can I become a service provider?",
    answer: "Absolutely! We welcome new providers. Simply sign up as a provider, complete our verification process, and start listing your services. We offer various membership plans for providers with different features and benefits.",
  },
  {
    question: "What service categories are available?",
    answer: "We offer 10+ service categories including Contractors, Machines, Land, Homes, Space, Manufacturing, Logistics, Vendors, Rental Services, and Construction. New categories are added based on customer demand.",
  },
  {
    question: "How do I leave a review?",
    answer: "After using a service, you'll receive an email invitation to leave a review. You can also access your booking history from your dashboard and leave reviews directly. Reviews help other customers and improve our platform.",
  },
];

const FAQSection = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.3 });
  const { ref: accordionRef, isVisible: accordionVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div 
          ref={headerRef}
          className={`text-center mb-8 sm:mb-10 md:mb-12 transition-all duration-700 ${
            headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
            Find answers to common questions about our platform
          </p>
        </div>
        <div 
          ref={accordionRef}
          className={`max-w-3xl mx-auto transition-all duration-700 ${
            accordionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`} 
                className={`border-b transition-all duration-500 ${
                  accordionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline text-sm sm:text-base pr-4 hover:text-primary transition-colors duration-300 group">
                  <span className="group-hover:translate-x-1 transition-transform duration-300">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed text-xs sm:text-sm pr-4 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;


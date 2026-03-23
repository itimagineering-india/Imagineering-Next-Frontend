import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = ({ items }: { items: { question: string; answer: string }[] }) => (
  <Accordion type="single" collapsible className="space-y-4">
    {items.map((item, index) => (
      <AccordionItem
        key={index}
        value={`item-${index}`}
        className="bg-card border rounded-lg px-4 md:px-6"
      >
        <AccordionTrigger className="text-left hover:no-underline">
          {item.question}
        </AccordionTrigger>
        <AccordionContent className="text-muted-foreground">
          {item.answer}
        </AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
);

export default FAQ;


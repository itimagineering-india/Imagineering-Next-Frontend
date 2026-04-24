import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-[16px] font-medium leading-[1.25] tracking-[0] ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C] focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[#F2F2F2] disabled:text-[#9CA3AF] disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#FF385C] text-white hover:bg-[#E03150]",
        primary: "bg-[#FF385C] text-white hover:bg-[#E03150]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "rounded-[20px] border border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#F9FAFB]",
        secondary: "rounded-[20px] border border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#F9FAFB]",
        ghost: "bg-transparent text-[#111827] hover:bg-[#F3F4F6]",
        link: "text-primary underline-offset-4 hover:underline",
        icon: "h-10 w-10 rounded-full bg-[#F3F4F6] p-0 text-[#111827] hover:bg-[#E5E7EB]",
        search: "h-12 w-12 rounded-full bg-[#FF385C] p-0 text-white hover:bg-[#E03150]",
        pillTab:
          "h-auto rounded-[999px] border border-transparent bg-transparent px-4 py-2 text-[16px] font-medium text-[#111827] hover:bg-[#F9FAFB] data-[state=active]:border-b-2 data-[state=active]:border-b-[#111827] data-[state=active]:rounded-b-none",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-10 px-4 text-[16px]",
        lg: "h-10 px-6 text-[16px]",
        icon: "h-10 w-10 p-0 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

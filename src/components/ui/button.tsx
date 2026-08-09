import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium cursor-pointer transition-[background-color,color,border-color] duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "rounded-sm bg-primary text-primary-foreground hover:bg-olive-soft",
        destructive: "rounded-sm bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "rounded-sm border border-border bg-transparent text-foreground hover:bg-premium",
        secondary: "rounded-sm bg-secondary text-secondary-foreground hover:bg-sand/60",
        ghost: "rounded-sm hover:bg-premium hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        /** Brand: quiet luxury outline with gold hairline. */
        gold: "rounded-sm border border-gold bg-transparent text-espresso hover:bg-premium",
        /** Brand: solid espresso for editorial surfaces. */
        espresso: "rounded-sm bg-espresso text-background hover:bg-truffle",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-3.5 text-xs",
        lg: "h-12 px-8 text-[0.9375rem]",
        icon: "h-11 w-11 rounded-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);


export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

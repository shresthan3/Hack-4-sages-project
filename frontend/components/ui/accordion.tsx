import type { HTMLAttributes, ReactNode } from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "./utils";

export function Accordion(props: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="accordion" {...props} />;
}

interface AccordionItemProps extends HTMLAttributes<HTMLDivElement> {}

export function AccordionItem({ className, ...props }: AccordionItemProps) {
  return (
    <div
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  );
}

interface AccordionTriggerProps
  extends HTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: AccordionTriggerProps) {
  return (
    <div className="flex">
      <button
        data-slot="accordion-trigger"
        className={cn(
          "flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium outline-none transition-all hover:underline",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="size-4 translate-y-0.5 shrink-0 text-gray-400" />
      </button>
    </div>
  );
}

interface AccordionContentProps
  extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function AccordionContent({
  className,
  children,
  ...props
}: AccordionContentProps) {
  return (
    <div
      data-slot="accordion-content"
      className="overflow-hidden text-sm"
      {...props}
    >
      <div className={cn("pb-4 pt-0", className)}>{children}</div>
    </div>
  );
}


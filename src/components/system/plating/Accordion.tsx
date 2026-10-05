import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes, type ReactNode } from 'react';
import * as Primitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import './accordion.css';

export type AccordionProps = Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'dir'> & {
  dir?: 'ltr' | 'rtl';
  multiple?: boolean;
  values?: string[];
  defaultValues?: string[];
  onValuesChange?: (values: string[]) => void;
  disabled?: boolean;
  variant?: 'inline' | 'separated';
  size?: 'medium' | 'large' | 'responsive';
};

/** A vertical collection of sections. Single Disclosure remains a separate primitive. */
export default function Accordion({ multiple = false, values, defaultValues, onValuesChange, disabled = false,
  variant = 'inline', size = 'medium', className = '', children, ...props }: AccordionProps) {
  const common = { ...props, disabled, className: `tb-pl-accordion ${className}`,
    'data-variant': variant, 'data-size': size };
  return multiple
    ? <Primitive.Root {...common} type="multiple" value={values} defaultValue={defaultValues} onValueChange={onValuesChange}>{children}</Primitive.Root>
    : <Primitive.Root {...common} type="single" collapsible value={values === undefined ? undefined : values[0] ?? ''}
        defaultValue={defaultValues?.[0]} onValueChange={value => onValuesChange?.(value ? [value] : [])}>{children}</Primitive.Root>;
}

export const AccordionItem = forwardRef<ElementRef<typeof Primitive.Item>, ComponentPropsWithoutRef<typeof Primitive.Item>>(
  function AccordionItem({ className = '', ...props }, ref) {
    return <Primitive.Item {...props} ref={ref} className={`tb-pl-accordion-item ${className}`} />;
  },
);

type TriggerProps = Omit<ComponentPropsWithoutRef<typeof Primitive.Trigger>, 'title' | 'children'> & {
  title: ReactNode;
  description?: ReactNode;
  prefix?: ReactNode;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
};

export const AccordionTrigger = forwardRef<ElementRef<typeof Primitive.Trigger>, TriggerProps>(
  function AccordionTrigger({ title, description, prefix, headingLevel = 3, className = '', ...props }, ref) {
    const Heading = `h${headingLevel}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    return <Primitive.Header asChild>
      <Heading className="tb-pl-accordion-header">
        <Primitive.Trigger {...props} ref={ref} className={`tb-pl-accordion-trigger ${className}`}>
          {prefix && <span className="tb-pl-accordion-prefix" aria-hidden="true">{prefix}</span>}
          <span className="tb-pl-accordion-heading">
            <span className="tb-pl-accordion-title">{title}</span>
            {description && <span className="tb-pl-accordion-description">{description}</span>}
          </span>
          <ChevronDown className="tb-pl-accordion-chevron" aria-hidden="true" />
        </Primitive.Trigger>
      </Heading>
    </Primitive.Header>;
  },
);

/** An animation container; the caller owns content typography and padding. */
export const AccordionContent = forwardRef<ElementRef<typeof Primitive.Content>, ComponentPropsWithoutRef<typeof Primitive.Content>>(
  function AccordionContent({ className = '', ...props }, ref) {
    return <Primitive.Content {...props} ref={ref} className={`tb-pl-accordion-content ${className}`} />;
  },
);

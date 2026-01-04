import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextType | undefined>(undefined);

interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ 
  open: controlledOpen, 
  defaultOpen, 
  onOpenChange,
  children
}) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen || false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  
  const handleOpenChange = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <DialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
};

const DialogTrigger = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & { asChild?: boolean }>(
  ({ className, children, asChild, ...props }, ref) => {
    const context = React.useContext(DialogContext);
    if (!context) throw new Error('DialogTrigger must be used within Dialog');
    
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        ...children.props,
        onClick: (e: React.MouseEvent) => {
          children.props.onClick?.(e);
          context.onOpenChange(true);
        }
      });
    }
    
    return (
      <button
        ref={ref as React.RefObject<HTMLButtonElement>}
        className={className}
        onClick={() => context.onOpenChange(true)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
DialogTrigger.displayName = "DialogTrigger";

const DialogContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(DialogContext);
    if (!context) throw new Error('DialogContent must be used within Dialog');
    
    React.useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          context.onOpenChange(false);
        }
      };
      
      if (context.open) {
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
      }
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    }, [context.open]);
    
    if (!context.open) return null;
    
    const handleBackdropClick = (e: React.MouseEvent) => {
      // Only close if clicked directly on backdrop, not on any child elements
      // Also check if click is coming from select or popover content
      const target = e.target as Element;
      const isSelectContent = target.closest('[data-radix-select-content]');
      const isPopoverContent = target.closest('[data-radix-popover-content]');
      const isSelectTrigger = target.closest('[data-radix-select-trigger]');
      const isPopoverTrigger = target.closest('[data-radix-popover-trigger]');
      
      if (e.target === e.currentTarget && !isSelectContent && !isPopoverContent && !isSelectTrigger && !isPopoverTrigger) {
        context.onOpenChange(false);
      }
    };
    
    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
          onClick={handleBackdropClick}
        />
        
        {/* Content */}
        <div className="fixed left-[50%] top-[10%] z-[80] translate-x-[-50%]">
          <div
            ref={ref}
            role="dialog"
            aria-modal="true"
            className={cn(
              "relative grid w-full max-w-lg gap-4 border border-gray-200 bg-white p-6 shadow-2xl duration-200 rounded-2xl max-h-[85vh] overflow-y-auto",
              className
            )}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            {...props}
          >
            {children}
            <button
              className="absolute right-4 top-4 z-10 rounded-full p-2 bg-gray-100 hover:bg-gray-200 opacity-70 transition-all hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => context.onOpenChange(false)}
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
      </>
    );
  }
);
DialogContent.displayName = "DialogContent";

const DialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
      {...props}
    />
  )
);
DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
);
DialogTitle.displayName = "DialogTitle";

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle };
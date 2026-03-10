import * as React from "react"
import { cn } from "@/lib/utils"

// A simplified generic Tabs component pattern
interface TabsProps {
    value: string;
    onValueChange: (value: string) => void;
    children: React.ReactNode;
    className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ value, onValueChange, children, className }) => {
    // We pass context down implicitly via clones for this simple implementation
    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child as any, { value, onValueChange });
        }
        return child;
    });
    return <div className={cn("w-full", className)}>{childrenWithProps}</div>;
}

export const TabsList: React.FC<any> = ({ className, children, value, onValueChange }) => {
    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
             return React.cloneElement(child as any, { 
                 selectedValue: value, 
                 onClick: () => onValueChange((child.props as any).value) 
             });
        }
        return child;
    });
    return (
        <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500", className)}>
            {childrenWithProps}
        </div>
    );
};

export const TabsTrigger: React.FC<any> = ({ value, selectedValue, onClick, children, className }) => {
    const isSelected = value === selectedValue;
    return (
        <button
            type="button"
            role="tab"
            aria-selected={isSelected}
            data-state={isSelected ? "active" : "inactive"}
            onClick={onClick}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isSelected ? "bg-white text-slate-950 shadow-sm" : "hover:bg-slate-200/50 hover:text-slate-900",
                className
            )}
        >
            {children}
        </button>
    );
};

export const TabsContent: React.FC<any> = ({ value, children, className, ...props }) => {
    // In this simple implementation we need to check context value. 
    // Ideally this comes from Context but for prop drilling in this file:
    // This component relies on the parent checking 'value' if used purely compositionally, 
    // OR it needs to receive the active value. 
    // For this generic mockup, we'll assume the parent `Tabs` handles visibility or we pass `value` down.
    // However, simplest usage is: {activeTab === 'x' && <TabsContent ... />} in the parent.
    // BUT to match shadcn API:
    return (
        <div
            className={cn("mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2", className)}
            {...props}
        >
            {children}
        </div>
    );
};
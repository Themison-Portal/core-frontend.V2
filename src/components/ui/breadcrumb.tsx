import React from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label?: string;
  href?: string;
  icon?: React.ElementType;
  isActive?: boolean;
  customContent?: React.ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  variant?: "default" | "header";
  className?: string;
}

export function Breadcrumb({
  items,
  variant = "default",
  className,
}: BreadcrumbProps) {
  if (!items.length) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center space-x-2 text-sm",
        variant === "header" ? "text-gray-500" : "text-gray-600 mb-6",
        className
      )}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        // If the item has custom content, render it
        if (item.customContent) {
          return (
            <React.Fragment key={index}>
              {item.customContent}
              {!isLast && <ChevronRight className="h-4 w-4 text-gray-400" />}
            </React.Fragment>
          );
        }

        // Regular breadcrumb item
        const ItemWrapper = ({ children }: { children: React.ReactNode }) => {
          if (item.href && !item.isActive) {
            return (
              <Link
                to={item.href}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {children}
              </Link>
            );
          }
          return <span className="text-gray-500">{children}</span>;
        };

        return (
          <React.Fragment key={index}>
            <div className="flex items-center">
              {item.icon && (
                <item.icon className="mr-1 h-4 w-4 text-gray-500" />
              )}
              <ItemWrapper>
                <span className="transition-colors">{item.label}</span>
              </ItemWrapper>
            </div>
            {!isLast && <ChevronRight className="h-4 w-4 text-gray-400" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

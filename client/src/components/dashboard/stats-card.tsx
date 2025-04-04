import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

interface StatsCardProps {
  icon: ReactNode;
  iconBgColor: string;
  iconColor: string;
  title: string;
  value: string | number;
  linkText?: string;
  linkHref?: string;
  trend?: {
    value: string | number;
    isPositive: boolean;
  };
}

export function StatsCard({
  icon,
  iconBgColor,
  iconColor,
  title,
  value,
  linkText,
  linkHref,
  trend
}: StatsCardProps) {
  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border-slate-200">
      <CardContent className="p-0">
        <div className="px-5 py-6">
          <div className="flex items-center">
            <div className={cn(
              "flex-shrink-0 rounded-xl p-3.5", 
              iconBgColor,
              "bg-opacity-15 backdrop-blur-sm"
            )}>
              {icon}
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-slate-500 truncate">
                  {title}
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-slate-900">{value}</div>
                  
                  {trend && (
                    <div className={cn(
                      "ml-2 flex items-baseline text-sm font-medium",
                      trend.isPositive ? "text-green-600" : "text-red-600"
                    )}>
                      <span className="sr-only">
                        {trend.isPositive ? "Increased" : "Decreased"} by
                      </span>
                      {trend.value}
                    </div>
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        {linkText && linkHref && (
          <div className="bg-slate-50 px-5 py-4 border-t border-slate-100">
            <div className="text-sm">
              <Link
                href={linkHref}
                className="font-medium text-primary-600 hover:text-primary-700 flex items-center"
              >
                <span>{linkText}</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

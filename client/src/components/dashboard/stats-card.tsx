import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  icon: ReactNode;
  iconBgColor: string;
  iconColor: string;
  title: string;
  value: string | number;
  linkText?: string;
  linkHref?: string;
}

export function StatsCard({
  icon,
  iconBgColor,
  iconColor,
  title,
  value,
  linkText,
  linkHref
}: StatsCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className={cn("flex-shrink-0 rounded-md p-3", iconBgColor)}>
              {icon}
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-slate-500 truncate">{title}</dt>
                <dd>
                  <div className="text-lg font-medium text-slate-900">{value}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
        {linkText && linkHref && (
          <div className="bg-slate-50 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <a
                href={linkHref}
                className="font-medium text-secondary-600 hover:text-secondary-500"
              >
                {linkText}
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

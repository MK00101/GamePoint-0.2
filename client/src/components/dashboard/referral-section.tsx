import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { generateReferralLink } from "@/lib/utils";

interface ReferralSectionProps {
  username: string;
  totalReferrals: number;
  totalEarnings: number;
}

export function ReferralSection({ 
  username, 
  totalReferrals, 
  totalEarnings 
}: ReferralSectionProps) {
  const { toast } = useToast();
  const [referralLink] = useState(generateReferralLink(username));

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard"
      });
    });
  };

  return (
    <Card className="shadow overflow-hidden mb-8">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-slate-900">Your Referrals</h3>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Invite friends and earn 10% of the prize pool when they join games.
          </p>
        </div>
        <Button 
          onClick={copyToClipboard}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-secondary-600 hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500"
        >
          Invite Friends
        </Button>
      </div>
      <div className="border-t border-slate-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-slate-200">
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-slate-500">Total referrals</dt>
            <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">
              {totalReferrals} friends invited
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-slate-500">Earnings from referrals</dt>
            <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">
              ${totalEarnings.toFixed(2)} earned from referred players
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-slate-500">Your referral link</dt>
            <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2 flex items-center">
              <Input
                type="text"
                value={referralLink}
                readOnly
                className="w-full focus:ring-secondary-500 focus:border-secondary-500 block sm:text-sm border-slate-300 rounded-md bg-slate-50"
              />
              <Button
                onClick={copyToClipboard}
                className="ml-3 inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-secondary-600 hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500"
                size="icon"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </Button>
            </dd>
          </div>
        </dl>
      </div>
    </Card>
  );
}

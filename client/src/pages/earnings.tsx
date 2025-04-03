import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { DollarSign, TrendingUp, Award, Users } from "lucide-react";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function Earnings() {
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuth();

  // Fetch earnings
  const { data: earningsData, isLoading: isLoadingEarnings } = useQuery({
    queryKey: ['/api/earnings'],
    enabled: !!user
  });

  // Fetch referrals
  const { data: referralsData, isLoading: isLoadingReferrals } = useQuery({
    queryKey: ['/api/referrals'],
    enabled: !!user
  });

  const earnings = earningsData?.earnings || [];
  const totalEarnings = earningsData?.total || 0;
  const referrals = referralsData?.referrals || [];
  const totalReferralEarnings = referralsData?.totalEarnings || 0;

  // Group earnings by type for pie chart
  const earningsByType = [
    { name: 'Winner', value: 0 },
    { name: 'Game Master', value: 0 },
    { name: 'Referrer', value: 0 }
  ];

  earnings.forEach(earning => {
    if (earning.type === 'winner') {
      earningsByType[0].value += earning.amount;
    } else if (earning.type === 'game_master') {
      earningsByType[1].value += earning.amount;
    } else if (earning.type === 'referrer') {
      earningsByType[2].value += earning.amount;
    }
  });

  // Format data for bar chart
  const monthlyEarnings = [];
  if (earnings.length) {
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = month.toLocaleString('default', { month: 'short' });
      
      const monthlyTotal = earnings
        .filter(earning => {
          const earningDate = new Date(earning.createdAt);
          return earningDate.getMonth() === month.getMonth() && 
                 earningDate.getFullYear() === month.getFullYear();
        })
        .reduce((sum, earning) => sum + earning.amount, 0);
      
      monthlyEarnings.push({
        name: monthName,
        amount: monthlyTotal
      });
    }
  }

  return (
    <AppLayout title="Earnings">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Earnings History</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-success-100 rounded-md p-3">
                    <DollarSign className="h-6 w-6 text-success-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-slate-500 truncate">Total Earnings</dt>
                      <dd>
                        <div className="text-lg font-medium text-slate-900">{formatCurrency(totalEarnings)}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-secondary-100 rounded-md p-3">
                    <Award className="h-6 w-6 text-secondary-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-slate-500 truncate">Tournament Winnings</dt>
                      <dd>
                        <div className="text-lg font-medium text-slate-900">
                          {formatCurrency(earningsByType[0].value)}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-warning-100 rounded-md p-3">
                    <TrendingUp className="h-6 w-6 text-warning-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-slate-500 truncate">Game Master Fees</dt>
                      <dd>
                        <div className="text-lg font-medium text-slate-900">
                          {formatCurrency(earningsByType[1].value)}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-slate-100 rounded-md p-3">
                    <Users className="h-6 w-6 text-slate-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-slate-500 truncate">Referral Earnings</dt>
                      <dd>
                        <div className="text-lg font-medium text-slate-900">
                          {formatCurrency(totalReferralEarnings)}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingEarnings ? (
                  <div className="h-80 flex items-center justify-center">
                    <p>Loading chart data...</p>
                  </div>
                ) : monthlyEarnings.length === 0 ? (
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-slate-500">No earnings data available</p>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyEarnings} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `$${value}`} />
                        <Tooltip formatter={(value) => [`$${value}`, 'Earnings']} />
                        <Bar dataKey="amount" fill="hsl(var(--chart-1))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Earnings by Type</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingEarnings ? (
                  <div className="h-80 flex items-center justify-center">
                    <p>Loading chart data...</p>
                  </div>
                ) : earnings.length === 0 ? (
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-slate-500">No earnings data available</p>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={earningsByType.filter(item => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {earningsByType.filter(item => item.value > 0).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Earnings History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingEarnings ? (
                <div className="flex justify-center py-8">
                  <p>Loading earnings history...</p>
                </div>
              ) : earnings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">You haven't earned any money yet.</p>
                  <p className="text-slate-500">Join games, create tournaments, or refer friends to start earning!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                      <tr>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Game</th>
                        <th className="px-6 py-3">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {earnings.map((earning) => (
                        <tr key={earning.id} className="bg-white border-b hover:bg-slate-50">
                          <td className="px-6 py-4">{formatDateTime(earning.createdAt)}</td>
                          <td className="px-6 py-4 capitalize">{earning.type.replace('_', ' ')}</td>
                          <td className="px-6 py-4">Game #{earning.gameId || '-'}</td>
                          <td className="px-6 py-4 font-medium text-success-600">
                            {formatCurrency(earning.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="referrals" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Referral Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingReferrals ? (
                <div className="flex justify-center py-8">
                  <p>Loading referral data...</p>
                </div>
              ) : referrals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">You haven't referred anyone yet.</p>
                  <p className="text-slate-500">Share your referral link to start earning 10% of the prize pool!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <dl>
                          <dt className="text-sm font-medium text-slate-500 truncate">Total Referrals</dt>
                          <dd className="mt-1 text-3xl font-semibold text-slate-900">
                            {referrals.length}
                          </dd>
                        </dl>
                      </div>
                    </div>
                    
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <dl>
                          <dt className="text-sm font-medium text-slate-500 truncate">Total Referral Earnings</dt>
                          <dd className="mt-1 text-3xl font-semibold text-success-600">
                            {formatCurrency(totalReferralEarnings)}
                          </dd>
                        </dl>
                      </div>
                    </div>
                    
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <dl>
                          <dt className="text-sm font-medium text-slate-500 truncate">Average Per Referral</dt>
                          <dd className="mt-1 text-3xl font-semibold text-slate-900">
                            {formatCurrency(referrals.length ? totalReferralEarnings / referrals.length : 0)}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Referred User</th>
                          <th className="px-6 py-3">Game</th>
                          <th className="px-6 py-3">Earnings</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referrals.map((referral) => (
                          <tr key={referral.id} className="bg-white border-b hover:bg-slate-50">
                            <td className="px-6 py-4">{formatDateTime(referral.createdAt)}</td>
                            <td className="px-6 py-4">User #{referral.referredUserId}</td>
                            <td className="px-6 py-4">Game #{referral.gameId || '-'}</td>
                            <td className="px-6 py-4 font-medium text-success-600">
                              {formatCurrency(referral.earnings)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}

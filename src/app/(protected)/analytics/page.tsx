"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { useMuteRules } from "@/hooks/use-mute-rules";
import { useAnalytics } from "@/hooks/use-analytics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Loader2, Download } from "lucide-react";

// Mock data for the charts
const PLATFORM_COLORS = {
  facebook: "#4267B2",
  twitter: "#1DA1F2",
  youtube: "#FF0000",
  reddit: "#FF4500",
  tiktok: "#000000",
  instagram: "#C13584",
  news: "#6B7280",
  all: "#3B82F6",
};

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { muteRules, isLoading } = useMuteRules();
  const analytics = useAnalytics();
  const [timeRange, setTimeRange] = useState("7d");
  
  // Log page view
  useEffect(() => {
    analytics.logPageView("analytics", "dashboard");
  }, [analytics]);
  
  // Calculate platform distribution
  const platformData = muteRules.reduce((acc, rule) => {
    rule.platforms.forEach(platform => {
      const platformId = platform.id;
      if (!acc[platformId]) {
        acc[platformId] = {
          name: platform.name,
          count: 0,
          color: PLATFORM_COLORS[platformId] || "#6B7280",
        };
      }
      acc[platformId].count += 1;
    });
    return acc;
  }, {});
  
  const platformChartData = Object.values(platformData);
  
  // Calculate keyword frequency
  const keywordData = {};
  muteRules.forEach(rule => {
    rule.keywords.forEach(keyword => {
      if (!keywordData[keyword]) {
        keywordData[keyword] = 0;
      }
      keywordData[keyword] += 1;
    });
  });
  
  // Sort keywords by frequency and take top 10
  const keywordChartData = Object.entries(keywordData)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Calculate rule duration distribution
  const durationData = [
    { name: "1 Day", count: 0 },
    { name: "3 Days", count: 0 },
    { name: "1 Week", count: 0 },
    { name: "Custom", count: 0 },
  ];
  
  muteRules.forEach(rule => {
    const durationMs = rule.durationMs;
    if (durationMs === 24 * 60 * 60 * 1000) {
      durationData[0].count += 1;
    } else if (durationMs === 3 * 24 * 60 * 60 * 1000) {
      durationData[1].count += 1;
    } else if (durationMs === 7 * 24 * 60 * 60 * 1000) {
      durationData[2].count += 1;
    } else {
      durationData[3].count += 1;
    }
  });
  
  // Calculate rule activity over time (mock data for now)
  const activityData = [
    { date: "2023-01-01", created: 3, applied: 12, overridden: 1 },
    { date: "2023-01-02", created: 2, applied: 8, overridden: 0 },
    { date: "2023-01-03", created: 5, applied: 20, overridden: 2 },
    { date: "2023-01-04", created: 1, applied: 15, overridden: 1 },
    { date: "2023-01-05", created: 4, applied: 18, overridden: 3 },
    { date: "2023-01-06", created: 2, applied: 10, overridden: 0 },
    { date: "2023-01-07", created: 3, applied: 14, overridden: 1 },
  ];
  
  // Handle export data
  const handleExportData = () => {
    // In a real implementation, this would generate a CSV or JSON file
    // with the user's analytics data
    alert("Export functionality will be implemented in a future update.");
  };
  
  return (
    <div className="container max-w-7xl py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Insights</h1>
          <p className="text-muted-foreground mt-1">
            Track your content filtering activity and effectiveness
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Loading analytics data...</span>
        </div>
      ) : (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="platforms">Platforms</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Mute Rules</CardTitle>
                  <CardDescription>Active and expired rules</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{muteRules.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Active Rules</CardTitle>
                  <CardDescription>Currently filtering content</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {muteRules.filter(rule => {
                      const now = Date.now();
                      const expiryTime = rule.startTime + rule.durationMs;
                      return now <= expiryTime;
                    }).length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Keywords</CardTitle>
                  <CardDescription>Across all rules</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {Object.keys(keywordData).length}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Rule Activity</CardTitle>
                  <CardDescription>Rules created and applied over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={activityData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="created" name="Rules Created" fill="#3B82F6" />
                        <Bar dataKey="applied" name="Rules Applied" fill="#10B981" />
                        <Bar dataKey="overridden" name="Rules Overridden" fill="#F59E0B" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Platform Distribution</CardTitle>
                  <CardDescription>Rules by platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={platformChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {platformChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="rules" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Keywords</CardTitle>
                  <CardDescription>Most frequently used keywords</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={keywordChartData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Duration Distribution</CardTitle>
                  <CardDescription>Rules by duration setting</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={durationData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          <Cell fill="#3B82F6" />
                          <Cell fill="#10B981" />
                          <Cell fill="#F59E0B" />
                          <Cell fill="#6B7280" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Advanced Filter Usage</CardTitle>
                <CardDescription>Usage of advanced filtering options</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Regex", count: muteRules.filter(r => r.useRegex).length },
                        { name: "Case Sensitive", count: muteRules.filter(r => r.caseSensitive).length },
                        { name: "Whole Word", count: muteRules.filter(r => r.matchWholeWord).length },
                      ]}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="platforms" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Effectiveness</CardTitle>
                  <CardDescription>Content filtered by platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: "Facebook", filtered: 120, overridden: 8 },
                          { name: "Twitter", filtered: 98, overridden: 12 },
                          { name: "YouTube", filtered: 86, overridden: 5 },
                          { name: "Reddit", filtered: 65, overridden: 3 },
                          { name: "TikTok", filtered: 45, overridden: 2 },
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="filtered" name="Content Filtered" fill="#10B981" />
                        <Bar dataKey="overridden" name="Filters Overridden" fill="#F59E0B" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Platform-Specific Keywords</CardTitle>
                  <CardDescription>Top keywords by platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 overflow-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Platform</th>
                          <th className="text-left py-2">Top Keywords</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2 font-medium">Facebook</td>
                          <td className="py-2">politics, news, ads</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-medium">Twitter</td>
                          <td className="py-2">trending, viral, breaking</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-medium">YouTube</td>
                          <td className="py-2">trailer, spoiler, review</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-medium">Reddit</td>
                          <td className="py-2">spoiler, AITA, update</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-medium">TikTok</td>
                          <td className="py-2">challenge, trend, viral</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Content Types</CardTitle>
                <CardDescription>Types of content filtered</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Posts", value: 45 },
                          { name: "Comments", value: 30 },
                          { name: "Videos", value: 15 },
                          { name: "Articles", value: 10 },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#3B82F6" />
                        <Cell fill="#10B981" />
                        <Cell fill="#F59E0B" />
                        <Cell fill="#6B7280" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

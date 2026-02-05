import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Clock, CheckCircle2, AlertTriangle, Sparkles, Zap, Star } from 'lucide-react';

/**
 * TabShowcase - Demo component showing all advanced tab interaction styles
 * This component is for demonstration purposes only
 */
export function TabShowcase() {
  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Advanced Tab Interactions Showcase</h1>
        <p className="text-muted-foreground">Hover, click, and interact with these tabs to see the amazing effects!</p>
      </div>

      {/* Standard Super Tabs - Like Timesheets */}
      <Card>
        <CardHeader>
          <CardTitle>Super Interactive Tabs</CardTitle>
          <CardDescription>Like the Timesheets tabs - 3D lift, elastic bounce, icon animations</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tab1" className="w-full">
            <TabsList className="grid w-full max-w-2xl grid-cols-3">
              <TabsTrigger value="tab1">
                <Clock className="h-4 w-4 mr-2" />
                Timesheets
              </TabsTrigger>
              <TabsTrigger value="tab2">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approvals (5)
              </TabsTrigger>
              <TabsTrigger value="tab3">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Exceptions (2)
              </TabsTrigger>
            </TabsList>
            <TabsContent value="tab1" className="mt-4">
              <div className="p-6 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Timesheets content with all time entries</p>
              </div>
            </TabsContent>
            <TabsContent value="tab2" className="mt-4">
              <div className="p-6 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Pending approvals from clients and accounting</p>
              </div>
            </TabsContent>
            <TabsContent value="tab3" className="mt-4">
              <div className="p-6 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Exception entries that need attention</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* With Icons */}
      <Card>
        <CardHeader>
          <CardTitle>Icon-Enhanced Tabs</CardTitle>
          <CardDescription>Icons bounce and rotate on hover, tabs lift with gradient backgrounds</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sparkles" className="w-full">
            <TabsList className="grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="sparkles">
                <Sparkles className="h-4 w-4 mr-2" />
                Sparkles
              </TabsTrigger>
              <TabsTrigger value="zap">
                <Zap className="h-4 w-4 mr-2" />
                Energy
              </TabsTrigger>
              <TabsTrigger value="star">
                <Star className="h-4 w-4 mr-2" />
                Featured
              </TabsTrigger>
            </TabsList>
            <TabsContent value="sparkles" className="mt-4">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                <p className="text-sm text-muted-foreground">✨ Magical sparkles content</p>
              </div>
            </TabsContent>
            <TabsContent value="zap" className="mt-4">
              <div className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg">
                <p className="text-sm text-muted-foreground">⚡ High energy content</p>
              </div>
            </TabsContent>
            <TabsContent value="star" className="mt-4">
              <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                <p className="text-sm text-muted-foreground">⭐ Featured special content</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Many Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Multiple Tabs Navigation</CardTitle>
          <CardDescription>Each tab has unique elastic bounce and 3D effects</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="inline-flex w-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="help">Help</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <div className="p-6 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Overview dashboard content</p>
              </div>
            </TabsContent>
            <TabsContent value="analytics" className="mt-4">
              <div className="p-6 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Analytics and insights</p>
              </div>
            </TabsContent>
            <TabsContent value="reports" className="mt-4">
              <div className="p-6 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Generated reports</p>
              </div>
            </TabsContent>
            <TabsContent value="settings" className="mt-4">
              <div className="p-6 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Configuration settings</p>
              </div>
            </TabsContent>
            <TabsContent value="help" className="mt-4">
              <div className="p-6 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Help documentation</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Features List */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Features</CardTitle>
          <CardDescription>Try the tabs above to experience these effects!</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>🎯 <strong>3D Transform:</strong> Tabs lift up with subtle 3D perspective on hover</li>
            <li>💫 <strong>Elastic Bounce:</strong> Click any tab to see a satisfying elastic bounce animation</li>
            <li>🎨 <strong>Gradient Background:</strong> Animated gradient slides up from bottom on hover</li>
            <li>✨ <strong>Icon Animation:</strong> Icons scale (1.2x) and rotate (10°) when you hover</li>
            <li>🔵 <strong>Colorful Shadow:</strong> Active tabs have blue glowing shadow underneath</li>
            <li>📊 <strong>Badge Counter:</strong> Number badges pop and rotate on hover</li>
            <li>🌊 <strong>Wave Effect:</strong> Background morphs with wave animation</li>
            <li>⚡ <strong>Smooth Transitions:</strong> All effects use smooth cubic-bezier easing</li>
            <li>🎭 <strong>Active State:</strong> Active tabs maintain elevated position and glow</li>
            <li>🚀 <strong>Performance:</strong> GPU-accelerated CSS animations for 60fps</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-medium text-blue-900">Pro Tip</p>
              <p className="text-sm text-blue-700">
                These same interactive effects are applied to ALL tabs throughout the OneHR platform, 
                making every interaction feel smooth and delightful! 🎉
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

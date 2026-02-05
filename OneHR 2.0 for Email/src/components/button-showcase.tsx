import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Sparkles, Zap, Star, Heart, Rocket, ArrowRight } from 'lucide-react';

/**
 * ButtonShowcase - Demo component showing all button interaction styles
 * This component is for demonstration purposes only
 */
export function ButtonShowcase() {
  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Interactive Button Showcase</h1>
        <p className="text-muted-foreground">Hover, click, and interact with these buttons to see the effects!</p>
      </div>

      {/* Primary Buttons with Different Effects */}
      <Card>
        <CardHeader>
          <CardTitle>Primary Action Buttons</CardTitle>
          <CardDescription>Ripple, glow, and shine effects on click</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button className="btn-glow-blue">
            <Sparkles className="h-4 w-4" />
            Default Button
          </Button>
          <Button variant="default" size="lg">
            <Rocket className="h-4 w-4" />
            Large Button
          </Button>
          <Button variant="default" size="sm">
            <Star className="h-4 w-4" />
            Small Button
          </Button>
        </CardContent>
      </Card>

      {/* Secondary & Outline Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Secondary Variants</CardTitle>
          <CardDescription>Fill and color transition effects</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button variant="secondary">
            <Heart className="h-4 w-4" />
            Secondary
          </Button>
          <Button variant="outline">
            <Zap className="h-4 w-4" />
            Outline
          </Button>
          <Button variant="ghost">
            Ghost Button
          </Button>
        </CardContent>
      </Card>

      {/* Destructive Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Destructive Actions</CardTitle>
          <CardDescription>Pink glow effect for dangerous actions</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button variant="destructive">
            Delete Item
          </Button>
          <Button variant="destructive" size="lg">
            Remove Forever
          </Button>
        </CardContent>
      </Card>

      {/* Icon Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Icon Buttons</CardTitle>
          <CardDescription>Compact buttons with scale and press effects</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button size="icon" variant="default">
            <Star className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline">
            <Heart className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary">
            <Zap className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost">
            <Sparkles className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Custom Gradient Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Gradient Quick Actions</CardTitle>
          <CardDescription>Gradient backgrounds with ripple, scale, and rotation effects</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="group relative h-24 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 p-px transition-all duration-300 overflow-hidden btn-ripple btn-scale btn-press hover:shadow-2xl btn-glow-blue">
            <div className="h-full w-full bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl p-5 flex items-center gap-4 btn-gradient-shift">
              <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Blue Action</p>
                <p className="text-blue-100 text-xs mt-0.5">Hover & Click</p>
              </div>
            </div>
          </button>

          <button className="group relative h-24 rounded-xl bg-gradient-to-br from-purple-400 to-purple-500 p-px transition-all duration-300 overflow-hidden btn-ripple btn-scale btn-press hover:shadow-2xl btn-glow-purple">
            <div className="h-full w-full bg-gradient-to-br from-purple-400 to-purple-500 rounded-xl p-5 flex items-center gap-4 btn-gradient-shift">
              <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Purple Action</p>
                <p className="text-purple-100 text-xs mt-0.5">Interactive</p>
              </div>
            </div>
          </button>

          <button className="group relative h-24 rounded-xl bg-gradient-to-br from-green-400 to-green-500 p-px transition-all duration-300 overflow-hidden btn-ripple btn-scale btn-press hover:shadow-2xl btn-glow-green">
            <div className="h-full w-full bg-gradient-to-br from-green-400 to-green-500 rounded-xl p-5 flex items-center gap-4 btn-gradient-shift">
              <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Green Action</p>
                <p className="text-green-100 text-xs mt-0.5">Satisfying</p>
              </div>
            </div>
          </button>
        </CardContent>
      </Card>

      {/* Button States */}
      <Card>
        <CardHeader>
          <CardTitle>Button States</CardTitle>
          <CardDescription>Disabled and loading states</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button disabled>
            Disabled Button
          </Button>
          <Button variant="outline" disabled>
            Disabled Outline
          </Button>
          <Button className="btn-loading">
            Loading...
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interactive Features</CardTitle>
          <CardDescription>Try these buttons to see the effects!</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>✨ <strong>Ripple Effect:</strong> Click any primary button to see a ripple animation</li>
            <li>🔍 <strong>Scale Animation:</strong> Buttons grow slightly on hover and shrink on click</li>
            <li>💫 <strong>Glow Effect:</strong> Colored buttons emit a colorful glow on hover</li>
            <li>✨ <strong>Shine Effect:</strong> Primary buttons have a shine sweep on hover</li>
            <li>🎯 <strong>Press Down:</strong> Buttons physically press down when clicked</li>
            <li>🔄 <strong>Icon Rotation:</strong> Icons in gradient buttons rotate slightly on hover</li>
            <li>🎨 <strong>Gradient Shift:</strong> Background gradients animate on hover</li>
            <li>💨 <strong>Color Transitions:</strong> Smooth color changes for all interactions</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

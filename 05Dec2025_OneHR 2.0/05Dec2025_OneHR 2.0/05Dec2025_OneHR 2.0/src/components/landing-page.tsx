import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Users, 
  Building2, 
  FileCheck, 
  Globe, 
  Award, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  Star,
  Zap,
  Shield,
  TrendingUp,
  Menu,
  X,
  Briefcase,
  BarChart3,
  Settings,
  HeadphonesIcon
} from 'lucide-react';
import { motion } from 'motion/react';

interface LandingPageProps {
  onLoginClick?: () => void;
  onSignupClick?: () => void;
}

export function LandingPage({ onLoginClick, onSignupClick }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: Users,
      title: "Employee Onboarding",
      description: "Streamline new hire processes with automated workflows, document collection, and compliance tracking."
    },
    {
      icon: Building2,
      title: "Client Onboarding",
      description: "Manage client relationships with comprehensive onboarding, vendor assignments, and project tracking."
    },
    {
      icon: Globe,
      title: "Immigration Management",
      description: "Track visas, work permits, and compliance documents with automated expiration alerts."
    },
    {
      icon: Award,
      title: "Licensing & Certifications",
      description: "Monitor professional licenses and certifications across your entire workforce."
    },
    {
      icon: Clock,
      title: "Smart Timesheets",
      description: "Weekly timesheet submission with multi-project support and HR approval workflows."
    },
    {
      icon: FileCheck,
      title: "Vendor Management",
      description: "Complete vendor hierarchy with client assignments, compliance tracking, and performance metrics."
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: "Save Time",
      stat: "70%",
      description: "Reduce administrative overhead with automated workflows"
    },
    {
      icon: Shield,
      title: "Stay Compliant",
      stat: "100%",
      description: "Never miss critical document expirations or renewals"
    },
    {
      icon: TrendingUp,
      title: "Scale Faster",
      stat: "3x",
      description: "Onboard employees and clients in minutes, not days"
    },
    {
      icon: BarChart3,
      title: "Gain Insights",
      stat: "Real-time",
      description: "Make data-driven decisions with comprehensive analytics"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "VP of HR, TechCorp",
      avatar: "SJ",
      content: "OneHR transformed our onboarding process. What used to take weeks now takes days. The immigration tracking alone has saved us countless hours.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "HR Director, GlobalStaff",
      avatar: "MC",
      content: "The vendor management features are game-changing. We can now track all our staffing vendors, their compliance status, and resource allocations in one place.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Operations Manager, ConsultPro",
      avatar: "ER",
      content: "Client onboarding has never been smoother. Our team loves the intuitive interface and our clients appreciate the professional experience.",
      rating: 5
    }
  ];

  const pricingTiers = [
    {
      name: "Starter",
      price: "$99",
      period: "per month",
      description: "Perfect for small businesses getting started",
      features: [
        "Up to 25 employees",
        "Up to 10 clients",
        "Basic onboarding workflows",
        "Timesheet management",
        "10GB document storage",
        "Email support",
        "Standard SLA (Business Hours)"
      ],
      highlighted: false
    },
    {
      name: "Professional",
      price: "$299",
      period: "per month",
      description: "Ideal for growing companies with advanced needs",
      features: [
        "Up to 100 employees",
        "Up to 50 clients",
        "Advanced workflows & automation",
        "Immigration & licensing tracking",
        "Vendor management",
        "100GB document storage",
        "API access & custom integrations",
        "SSO enabled",
        "Custom reports & audit logs",
        "Priority support (24/5)"
      ],
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "$999",
      period: "per month",
      description: "For large organizations with complex requirements",
      features: [
        "Unlimited employees",
        "Unlimited clients",
        "All Professional features",
        "Multi-company support",
        "Unlimited document storage",
        "Advanced analytics",
        "White-label options",
        "Custom development",
        "Dedicated account manager",
        "24/7 support with SLA guarantees"
      ],
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg p-2">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl text-slate-900">OneHR</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors">
                Features
              </a>
              <a href="#benefits" className="text-slate-600 hover:text-slate-900 transition-colors">
                Benefits
              </a>
              <a href="#testimonials" className="text-slate-600 hover:text-slate-900 transition-colors">
                Testimonials
              </a>
              <a href="#pricing" className="text-slate-600 hover:text-slate-900 transition-colors">
                Pricing
              </a>
              <Button variant="ghost" onClick={onLoginClick}>Login</Button>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" onClick={onSignupClick}>
                Start Free Trial
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-slate-600 hover:text-slate-900">
                Features
              </a>
              <a href="#benefits" className="block text-slate-600 hover:text-slate-900">
                Benefits
              </a>
              <a href="#testimonials" className="block text-slate-600 hover:text-slate-900">
                Testimonials
              </a>
              <a href="#pricing" className="block text-slate-600 hover:text-slate-900">
                Pricing
              </a>
              <div className="pt-3 space-y-2">
                <Button variant="outline" className="w-full" onClick={onLoginClick}>Login</Button>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600" onClick={onSignupClick}>
                  Start Free Trial
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-indigo-600/5 to-purple-600/5" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
                <Zap className="h-3 w-3 mr-1" />
                Trusted by 500+ Companies
              </Badge>
              
              <h1 className="text-slate-900 mb-6">
                The Modern HR Platform for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Growing Teams</span>
              </h1>
              
              <p className="text-slate-600 mb-8 max-w-xl">
                Streamline employee onboarding, manage client relationships, track immigration & licensing, 
                and handle timesheets—all in one powerful platform. Built for HR teams who demand more.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/30"
                  onClick={onSignupClick}
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline">
                  Schedule Demo
                </Button>
              </div>

              <div className="flex items-center gap-6 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>14-day free trial</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-blue-600/20 border border-slate-200 bg-white">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-3 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 text-center text-slate-400 text-xs">
                    OneHR Dashboard
                  </div>
                </div>
                
                <div className="p-6 bg-gradient-to-br from-slate-50 to-white">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <Card className="border-none shadow-md">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-slate-600">Active Employees</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-end gap-2">
                          <span className="text-2xl text-slate-900">248</span>
                          <span className="text-green-600 text-xs mb-1">+12%</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-none shadow-md">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-slate-600">Active Projects</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-end gap-2">
                          <span className="text-2xl text-slate-900">42</span>
                          <span className="text-green-600 text-xs mb-1">+8%</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border-none shadow-md">
                    <CardHeader>
                      <CardTitle className="text-sm">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { name: "Sarah Chen", action: "completed onboarding", time: "2m ago" },
                        { name: "Mike Ross", action: "submitted timesheet", time: "15m ago" },
                        { name: "Emma Wilson", action: "visa renewed", time: "1h ago" }
                      ].map((activity, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs">
                            {activity.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-900 truncate">
                              <span>{activity.name}</span>
                              <span className="text-slate-600"> {activity.action}</span>
                            </p>
                            <p className="text-xs text-slate-500">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4 border border-slate-200"
              >
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Compliance</p>
                    <p className="text-sm text-slate-900">100% Up-to-date</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 border border-slate-200"
              >
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Time Saved</p>
                    <p className="text-sm text-slate-900">240 hours/mo</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
              Features
            </Badge>
            <h2 className="text-slate-900 mb-4">
              Everything Your HR Team Needs
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              From employee onboarding to compliance tracking, OneHR provides all the tools 
              you need to manage your workforce effectively.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-slate-200 hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-slate-900">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
              Why OneHR
            </Badge>
            <h2 className="text-slate-900 mb-4">
              Transform Your HR Operations
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Join hundreds of companies that have revolutionized their HR processes with OneHR
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="text-center border-slate-200 bg-white hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-4">
                      <benefit.icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-4xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
                      {benefit.stat}
                    </div>
                    <CardTitle className="text-slate-900">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700 hover:bg-purple-100">
              Testimonials
            </Badge>
            <h2 className="text-slate-900 mb-4">
              Loved by HR Teams Worldwide
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              See what our customers have to say about their experience with OneHR
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-slate-200 hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <CardTitle className="text-sm text-slate-900">{testimonial.name}</CardTitle>
                        <p className="text-xs text-slate-600">{testimonial.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 mb-3">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 italic">"{testimonial.content}"</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-700 hover:bg-green-100">
              Pricing
            </Badge>
            <h2 className="text-slate-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Choose the plan that fits your team size and needs. All plans include core features.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={tier.highlighted ? 'md:-mt-4' : ''}
              >
                <Card className={`h-full relative ${
                  tier.highlighted 
                    ? 'border-2 border-blue-600 shadow-2xl shadow-blue-600/20' 
                    : 'border-slate-200'
                }`}>
                  {tier.highlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader>
                    <CardTitle className="text-slate-900">{tier.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl text-slate-900">{tier.price}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">{tier.period}</p>
                    <CardDescription className="mt-4">{tier.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className={`w-full ${
                        tier.highlighted
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                          : ''
                      }`}
                      variant={tier.highlighted ? 'default' : 'outline'}
                      onClick={tier.price === "Custom" ? undefined : onSignupClick}
                    >
                      {tier.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-white mb-4">
            Ready to Transform Your HR Operations?
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of companies using OneHR to streamline their HR processes. 
            Start your free 14-day trial today—no credit card required.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl"
              onClick={onSignupClick}
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white/10"
            >
              <HeadphonesIcon className="mr-2 h-4 w-4" />
              Talk to Sales
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-4 text-blue-100 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg p-2">
                  <Briefcase className="h-5 w-5 text-white" />
                </div>
                <span className="text-white">OneHR</span>
              </div>
              <p className="text-sm text-slate-400">
                Modern HR management for growing teams. Streamline onboarding, compliance, and more.
              </p>
            </div>

            <div>
              <h3 className="text-white mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GDPR</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-400">
              © 2024 OneHR. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <span className="sr-only">GitHub</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

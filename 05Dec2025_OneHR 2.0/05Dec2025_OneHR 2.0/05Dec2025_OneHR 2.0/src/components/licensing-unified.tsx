import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { FileText, Building2 } from 'lucide-react';
import { BusinessLicensingCategorized } from './business-licensing-categorized';
import { StateLicensing } from './state-licensing';

export function LicensingUnified() {
  const [activeTab, setActiveTab] = useState('business');

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Licensing Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage business and state licensing requirements
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="business" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Business Licensing
          </TabsTrigger>
          <TabsTrigger value="state" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            State Licensing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="space-y-6">
          <BusinessLicensingCategorized />
        </TabsContent>

        <TabsContent value="state" className="space-y-6">
          <StateLicensing />
        </TabsContent>
      </Tabs>
    </div>
  );
}

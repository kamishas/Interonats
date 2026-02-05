import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { CheckCircle2, Clock, Circle, AlertCircle, FileText, Send, ThumbsUp, XCircle } from "lucide-react";
import { format } from "date-fns";
import type { TimelineEvent } from "../types";

interface ImmigrationTimelineProps {
  events: TimelineEvent[];
  title?: string;
}

export function ImmigrationTimeline({ events, title = "Case Timeline" }: ImmigrationTimelineProps) {
  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getEventIcon = (event: string) => {
    const eventLower = event.toLowerCase();
    
    if (eventLower.includes('approved') || eventLower.includes('completed')) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    if (eventLower.includes('filed') || eventLower.includes('submitted')) {
      return <Send className="h-5 w-5 text-blue-600" />;
    }
    if (eventLower.includes('rfe') || eventLower.includes('request')) {
      return <AlertCircle className="h-5 w-5 text-orange-600" />;
    }
    if (eventLower.includes('denied') || eventLower.includes('rejected')) {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
    if (eventLower.includes('document') || eventLower.includes('upload')) {
      return <FileText className="h-5 w-5 text-purple-600" />;
    }
    if (eventLower.includes('pending') || eventLower.includes('waiting')) {
      return <Clock className="h-5 w-5 text-yellow-600" />;
    }
    
    return <Circle className="h-5 w-5 text-gray-400" />;
  };

  const getEventColor = (event: string) => {
    const eventLower = event.toLowerCase();
    
    if (eventLower.includes('approved') || eventLower.includes('completed')) {
      return 'border-green-500 bg-green-50';
    }
    if (eventLower.includes('filed') || eventLower.includes('submitted')) {
      return 'border-blue-500 bg-blue-50';
    }
    if (eventLower.includes('rfe') || eventLower.includes('request')) {
      return 'border-orange-500 bg-orange-50';
    }
    if (eventLower.includes('denied') || eventLower.includes('rejected')) {
      return 'border-red-500 bg-red-50';
    }
    if (eventLower.includes('document') || eventLower.includes('upload')) {
      return 'border-purple-500 bg-purple-50';
    }
    
    return 'border-gray-300 bg-gray-50';
  };

  if (sortedEvents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No timeline events yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute left-[21px] top-2 bottom-2 w-0.5 bg-border" />
          
          {sortedEvents.map((event, index) => (
            <div key={event.id} className="relative flex gap-4">
              {/* Icon */}
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-white">
                {getEventIcon(event.event)}
              </div>
              
              {/* Content */}
              <div className={`flex-1 rounded-lg border-l-4 p-4 ${getEventColor(event.event)}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{event.event}</h4>
                      <Badge variant="outline" className="text-xs">
                        {format(new Date(event.date), "MMM dd, yyyy")}
                      </Badge>
                    </div>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.description}
                      </p>
                    )}
                    {event.performedBy && (
                      <p className="text-xs text-muted-foreground mt-2">
                        By: {event.performedBy}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

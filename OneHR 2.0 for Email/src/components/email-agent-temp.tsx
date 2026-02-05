                {/* Recipient List Section */}
                <div className="space-y-3 border-t pt-4">
                  <Label className="text-sm font-semibold">Recipients & Delivery Status</Label>
                  
                  {viewEmail.recipients && viewEmail.recipients.length > 0 ? (
                    <div className="space-y-3">
                      {/* Recipient count */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Total: {viewEmail.recipients.length} recipient{viewEmail.recipients.length > 1 ? 's' : ''}</span>
                      </div>
                      
                      {/* Individual recipients list */}
                      <div className="space-y-2 max-h-[300px] overflow-y-auto border-2 border-slate-200 rounded-lg p-4 bg-slate-50">
                        {viewEmail.recipients.map((recipient, idx) => (
                          <div 
                            key={`${recipient.email}-${idx}`}
                            className="flex items-center justify-between py-3 px-4 rounded-lg bg-white border-2 border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex-1 min-w-0 mr-4">
                              <div className="font-semibold text-base text-slate-900">{recipient.name}</div>
                              <div className="text-sm text-slate-500 mt-1">{recipient.email}</div>
                            </div>
                            <Badge 
                              variant={
                                recipient.status === 'Delivered' ? 'default' : 
                                recipient.status === 'Failed' ? 'destructive' : 
                                'secondary'
                              }
                              className="ml-2 shrink-0 flex items-center gap-1 px-3 py-1"
                            >
                              {recipient.status === 'Delivered' && <CheckCircle2 className="h-3.5 w-3.5" />}
                              {recipient.status === 'Failed' && <AlertTriangle className="h-3.5 w-3.5" />}
                              <span className="font-medium">{recipient.status}</span>
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Show recipient chips like in Compose view */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{(() => {
                          const emails = viewEmail.to.split(',').filter(e => e.trim());
                          return `Total: ${emails.length} recipient${emails.length > 1 ? 's' : ''}`;
                        })()}</span>
                      </div>
                      
                      {/* Display recipient names as chips */}
                      <div className="flex flex-wrap gap-2 p-4 bg-slate-50 border-2 border-slate-200 rounded-lg">
                        {(() => {
                          const fullText = viewEmail.recipientName;
                          let names: string[] = [];
                          
                          if (fullText.includes(' + ')) {
                            const emails = viewEmail.to.split(',').map(e => e.trim()).filter(e => e);
                            names = emails.map(email => {
                              const localPart = email.split('@')[0];
                              return localPart.split('.').map(part => 
                                part.charAt(0).toUpperCase() + part.slice(1)
                              ).join(' ');
                            });
                          } else {
                            names = [fullText];
                          }
                          
                          return names.map((name, idx) => (
                            <Badge 
                              key={idx}
                              variant="secondary" 
                              className="px-3 py-1.5 text-sm font-medium bg-white border-2 border-slate-200"
                            >
                              {name}
                            </Badge>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </div>

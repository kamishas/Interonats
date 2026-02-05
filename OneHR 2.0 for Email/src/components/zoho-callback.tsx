import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from './ui/button';

export function ZohoCallback() {
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
    const [message, setMessage] = useState('Connecting to Zoho...');

    useEffect(() => {
        const handleCallback = async () => {
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');
            const error = params.get('error');

            if (error) {
                setStatus('error');
                setMessage(`Zoho Connection Failed: ${error}`);
                return;
            }

            if (!code) {
                setStatus('error');
                setMessage('No authorization code received.');
                return;
            }

            try {
                setMessage('Exchanging tokens...');
                const response = await fetch('https://5cs5faz106.execute-api.us-east-2.amazonaws.com/prod/auth/zoho/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ code })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to exchange token');
                }

                // Success!
                setStatus('success');
                setMessage('Zoho Connected Successfully!');

                // Notify Opener
                if (window.opener) {
                    window.opener.postMessage({
                        type: 'ZOHO_CONNECTED',
                        expiresIn: data.expiresIn,
                        expiresAt: data.expiresAt
                    }, window.location.origin);

                    // Auto close after 2 seconds
                    setTimeout(() => {
                        window.close();
                    }, 2000);
                }

            } catch (err: any) {
                console.error('Callback error:', err);
                setStatus('error');
                setMessage(err.message || 'Connection failed');
            }
        };

        handleCallback();
    }, []);

    return (
        <div className="fixed inset-0 bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-card border rounded-lg shadow-lg p-6 text-center space-y-4">
                {status === 'processing' && (
                    <>
                        <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto" />
                        <h2 className="text-xl font-semibold">Connecting...</h2>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                        <h2 className="text-xl font-semibold text-green-700">Connected!</h2>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle className="h-12 w-12 text-red-500 mx-auto" />
                        <h2 className="text-xl font-semibold text-red-600">Connection Failed</h2>
                    </>
                )}

                <p className="text-muted-foreground">{message}</p>

                {status === 'error' && (
                    <Button onClick={() => window.close()} variant="outline" className="mt-4">
                        Close Window
                    </Button>
                )}
            </div>
        </div>
    );
}

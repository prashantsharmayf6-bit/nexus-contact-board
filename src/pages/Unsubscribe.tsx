import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { MailX, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'valid' | 'already' | 'invalid' | 'success' | 'error'>('loading');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }
    const validate = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`, {
          headers: { apikey: anonKey },
        });
        const data = await res.json();
        if (data.valid === false && data.reason === 'already_unsubscribed') setStatus('already');
        else if (data.valid) setStatus('valid');
        else setStatus('invalid');
      } catch { setStatus('error'); }
    };
    validate();
  }, [token]);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const { data } = await supabase.functions.invoke('handle-email-unsubscribe', { body: { token } });
      if (data?.success) setStatus('success');
      else if (data?.reason === 'already_unsubscribed') setStatus('already');
      else setStatus('error');
    } catch { setStatus('error'); }
    setConfirming(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full rounded-2xl border border-border/40 bg-card p-8 text-center shadow-lg">
        {status === 'loading' && (
          <>
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Validating your request...</p>
          </>
        )}
        {status === 'valid' && (
          <>
            <MailX className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">Unsubscribe from emails</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Click below to stop receiving app emails from Ezy CRM. Authentication emails like password resets will still be delivered.
            </p>
            <Button onClick={handleConfirm} disabled={confirming} className="w-full">
              {confirming ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Confirm Unsubscribe
            </Button>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">You've been unsubscribed</h1>
            <p className="text-sm text-muted-foreground">You will no longer receive app emails from Ezy CRM.</p>
          </>
        )}
        {status === 'already' && (
          <>
            <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">Already unsubscribed</h1>
            <p className="text-sm text-muted-foreground">You've already unsubscribed from these emails.</p>
          </>
        )}
        {(status === 'invalid' || status === 'error') && (
          <>
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">Invalid link</h1>
            <p className="text-sm text-muted-foreground">This unsubscribe link is invalid or has expired.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Unsubscribe;

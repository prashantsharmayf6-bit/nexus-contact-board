import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { CheckCircle, Loader2, ScanLine, X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
}

const parseVCard = (text: string): Partial<FormData> => {
  const result: Partial<FormData> = {};

  // Try vCard format
  if (text.includes('BEGIN:VCARD')) {
    const fnMatch = text.match(/FN[^:]*:(.*)/i);
    const nMatch = text.match(/\nN[^:]*:(.*)/i);
    const emailMatch = text.match(/EMAIL[^:]*:(.*)/i);
    const telMatch = text.match(/TEL[^:]*:(.*)/i);
    const orgMatch = text.match(/ORG[^:]*:(.*)/i);

    if (fnMatch) result.name = fnMatch[1].trim();
    else if (nMatch) {
      const parts = nMatch[1].split(';').map(s => s.trim()).filter(Boolean);
      result.name = parts.length >= 2 ? `${parts[1]} ${parts[0]}` : parts[0];
    }
    if (emailMatch) result.email = emailMatch[1].trim();
    if (telMatch) result.phone = telMatch[1].trim();
    if (orgMatch) result.company = orgMatch[1].split(';')[0].trim();
    return result;
  }

  // Try MECARD format: MECARD:N:Name;TEL:123;EMAIL:a@b.com;;
  if (text.startsWith('MECARD:')) {
    const nMatch = text.match(/N:(.*?);/);
    const telMatch = text.match(/TEL:(.*?);/);
    const emailMatch = text.match(/EMAIL:(.*?);/);
    const orgMatch = text.match(/ORG:(.*?);/);
    if (nMatch) result.name = nMatch[1].replace(/,/g, ' ').trim();
    if (telMatch) result.phone = telMatch[1].trim();
    if (emailMatch) result.email = emailMatch[1].trim();
    if (orgMatch) result.company = orgMatch[1].trim();
    return result;
  }

  // Try JSON format
  try {
    const json = JSON.parse(text);
    if (json.name) result.name = json.name;
    if (json.email) result.email = json.email;
    if (json.phone || json.tel) result.phone = json.phone || json.tel;
    if (json.company || json.org) result.company = json.company || json.org;
    return result;
  } catch {}

  // Fallback: treat as plain text name
  if (text.trim().length > 0 && text.trim().length < 200) {
    result.name = text.trim();
  }

  return result;
};

const PublicLeadForm = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', phone: '', company: '', message: '' });
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader';

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.stop(); } catch {}
      }
    };
  }, []);

  const startScanner = async () => {
    setScanning(true);
    setError('');

    // Wait for DOM element to render
    await new Promise(r => setTimeout(r, 100));

    try {
      const scanner = new Html5Qrcode(scannerContainerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          const parsed = parseVCard(decodedText);
          setFormData(prev => ({
            name: parsed.name || prev.name,
            email: parsed.email || prev.email,
            phone: parsed.phone || prev.phone,
            company: parsed.company || prev.company,
            message: parsed.message || prev.message,
          }));
          stopScanner();
        },
        () => {} // ignore scan failures
      );
    } catch (err) {
      setError('Could not access camera. Please allow camera permissions.');
      setScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.name.trim()) {
      setError('Name is required');
      setLoading(false);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const ownerId = params.get('uid');

    if (!ownerId) {
      setError('Invalid form link');
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('leads')
      .insert({
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        company: formData.company.trim() || null,
        notes: formData.message.trim() || null,
        user_id: ownerId,
        source: 'public_form',
        status: 'new',
      });

    if (insertError) {
      setError('Something went wrong. Please try again.');
      console.error(insertError);
    } else {
      setSubmitted(true);
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4">
            <CheckCircle className="h-16 w-16 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Thank You!</h2>
            <p className="text-muted-foreground">Your information has been submitted successfully. We'll be in touch soon.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Get In Touch</CardTitle>
          <CardDescription>Fill out the form below or scan a QR code to auto-fill your details.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* QR Scanner Section */}
          <div className="mb-4">
            {!scanning ? (
              <Button type="button" variant="outline" className="w-full" onClick={startScanner}>
                <ScanLine className="w-4 h-4 mr-2" /> Scan QR / vCard
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <div id={scannerContainerId} className="w-full" />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 z-10 h-8 w-8"
                    onClick={stopScanner}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">Point your camera at a QR code or vCard</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" name="name" placeholder="Your full name" required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" name="company" placeholder="Your company name" value={formData.company} onChange={e => setFormData(p => ({ ...p, company: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" name="message" placeholder="How can we help you?" rows={3} value={formData.message} onChange={e => setFormData(p => ({ ...p, message: e.target.value }))} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicLeadForm;

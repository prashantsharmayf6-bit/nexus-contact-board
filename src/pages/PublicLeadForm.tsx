import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { CheckCircle, Loader2 } from 'lucide-react';

const PublicLeadForm = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = new FormData(e.currentTarget);
    const name = (form.get('name') as string)?.trim();
    const email = (form.get('email') as string)?.trim();
    const phone = (form.get('phone') as string)?.trim();
    const company = (form.get('company') as string)?.trim();
    const notes = (form.get('message') as string)?.trim();

    if (!name) {
      setError('Name is required');
      setLoading(false);
      return;
    }

    // Get owner_id from URL params (the CRM user sharing the form)
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
        name,
        email: email || null,
        phone: phone || null,
        company: company || null,
        notes: notes || null,
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
            <CheckCircle className="h-16 w-16 text-green-500" />
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
          <CardDescription>Fill out the form below and we'll get back to you.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" name="name" placeholder="Your full name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" placeholder="+1 (555) 000-0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" name="company" placeholder="Your company name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" name="message" placeholder="How can we help you?" rows={3} />
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

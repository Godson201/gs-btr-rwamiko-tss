'use client';

import { Suspense, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AuthShowcasePanel } from '@/components/auth/auth-showcase-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';

const resetSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type ResetValues = z.infer<typeof resetSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '' },
  });

  const onSubmit = async (values: ResetValues) => {
    if (!token) {
      setServerError('This reset link is missing a token. Please request a new one.');
      return;
    }
    setServerError(null);
    try {
      await api.post('/auth/reset-password', { token, password: values.password });
      setSuccess(true);
      setTimeout(() => router.push('/auth/login'), 2000);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Reset failed');
    }
  };

  if (success) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Password updated. Redirecting you to sign in…
      </p>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {serverError && <p className="text-sm text-destructive">{serverError}</p>}
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : 'Set new password'}
        </Button>
      </form>
    </Form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthShowcasePanel
        title="Choose a new password"
        description="Pick a strong password you haven't used before."
      />
      <div className="flex items-center justify-center bg-secondary/30 px-4 py-12">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Set a new password</CardTitle>
            <CardDescription>This link is valid for 1 hour</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<p className="text-center text-sm text-muted-foreground">Loading…</p>}>
              <ResetPasswordForm />
            </Suspense>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link href="/auth/login" className="font-medium text-primary hover:underline">
                Back to sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

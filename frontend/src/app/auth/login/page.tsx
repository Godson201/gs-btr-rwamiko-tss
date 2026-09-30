'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AuthShowcasePanel } from '@/components/auth/auth-showcase-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { LanguageSwitcher } from '@/components/shared/language-switcher';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email or phone number'),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [slowConnection, setSlowConnection] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const submitting = form.formState.isSubmitting;
  useEffect(() => {
    if (!submitting) return;
    const timer = window.setTimeout(() => setSlowConnection(true), 8000);
    return () => window.clearTimeout(timer);
  }, [submitting]);

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    setSlowConnection(false);
    try {
      await login(values.email, values.password);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Login failed');
    }
  };

  return (
    <div className="auth-shell grid min-h-screen lg:grid-cols-2">
      <AuthShowcasePanel
        title="Welcome back"
        description="Sign in to manage classes, track progress, and stay connected with G.S BTR RWAMIKO TSS."
      />
      <div className="relative flex items-center justify-center bg-secondary/30 px-4 py-12">
        <div className="absolute right-4 top-4 lg:hidden"><LanguageSwitcher compact /></div>
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">G.S BTR RWAMIKO TSS</CardTitle>
            <CardDescription>Sign in to the School Management System</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email or phone number</FormLabel>
                      <FormControl>
                        <Input type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="you@gsbtrrwamiko.rw or 078xxxxxxx" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <FormLabel>Password</FormLabel>
                        <Link
                          href="/auth/forgot-password"
                          className="text-xs text-muted-foreground hover:text-primary hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {submitting && slowConnection && <p role="status" data-no-translate className="text-sm text-muted-foreground">Connecting to the school server. It may take about a minute to start. Please keep this page open.</p>}
                {serverError && <p role="alert" data-no-translate className="text-sm text-destructive">{serverError}</p>}
                <Button type="submit" data-no-translate className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
                </Button>
              </form>
            </Form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Are you a parent?{' '}
              <Link href="/auth/signup" className="font-medium text-primary hover:underline">
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

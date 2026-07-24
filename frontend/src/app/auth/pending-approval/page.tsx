'use client';

import Link from 'next/link';
import { Clock, XCircle } from 'lucide-react';
import { AuthShowcasePanel } from '@/components/auth/auth-showcase-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';

export default function PendingApprovalPage() {
  const { user, logout } = useAuth();
  const isRejected = user?.accountStatus === 'REJECTED';

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthShowcasePanel
        title={isRejected ? 'Registration declined' : 'Almost there'}
        description="Every parent account is verified by the school office before it can access the parent portal."
      />
      <div className="flex items-center justify-center bg-secondary/30 px-4 py-12">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary">
              {isRejected ? (
                <XCircle className="size-6 text-destructive" />
              ) : (
                <Clock className="size-6 text-primary" />
              )}
            </div>
            <CardTitle className="text-xl">
              {isRejected ? 'We could not verify this account' : 'Your account is awaiting approval'}
            </CardTitle>
            <CardDescription>
              {isRejected
                ? "The school office wasn't able to confirm you have a student enrolled here. Please visit or call the school office to sort this out."
                : "We're checking that you're a real parent or guardian with a student enrolled at G.S BTR RWAMIKO TSS. This is usually reviewed within a school day."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              In the meantime you can still browse the public school website. You&apos;ll gain full
              parent-portal access as soon as your account is approved.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="outline">
                <Link href="/">Browse the public website</Link>
              </Button>
              <Button variant="ghost" onClick={() => logout()}>
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

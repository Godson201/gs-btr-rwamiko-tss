import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-primary/10 via-background to-background px-4 text-center">
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">G.S BTR RWAMIKO TSS</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          &ldquo;Through Here, Wealth is Flash&rdquo;
        </h1>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          The public school website is coming soon. Staff, students and parents can access the
          School Management System below.
        </p>
      </div>
      <Button asChild size="lg">
        <Link href="/auth/login">Sign in to the portal</Link>
      </Button>
    </main>
  );
}

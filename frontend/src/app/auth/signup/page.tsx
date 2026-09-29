'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CheckCircle2, Search } from 'lucide-react';
import { AuthShowcasePanel } from '@/components/auth/auth-showcase-panel';
import { LocationPicker, type LocationPickerValue } from '@/components/shared/location-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { LanguageSwitcher } from '@/components/shared/language-switcher';

const signupSchema = z
  .object({
    firstName: z.string().min(1, 'Required'),
    lastName: z.string().min(1, 'Required'),
    email: z.string().email('Enter a valid email address'),
    phone: z.string().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    nickname: z.string().optional(),
    jobTitle: z.string().optional(),
    dateOfBirth: z.string().optional(),
    relationship: z.string().optional(),
    occupation: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupValues = z.infer<typeof signupSchema>;

const STEP_FIELDS: Record<number, (keyof SignupValues)[]> = {
  1: ['firstName', 'lastName', 'email', 'phone', 'password', 'confirmPassword'],
  2: ['nickname', 'jobTitle', 'dateOfBirth', 'relationship', 'occupation'],
  3: [],
  4: [],
};

const TOTAL_STEPS = 4;

interface StudentMatch {
  id: string;
  firstName: string;
  lastName: string;
  className: string | null;
}

export default function SignupPage() {
  const { registerParent } = useAuth();
  const [step, setStep] = useState(1);
  const [serverError, setServerError] = useState<string | null>(null);
  const [residence, setResidence] = useState<LocationPickerValue | null>(null);
  const [workplace, setWorkplace] = useState<LocationPickerValue | null>(null);
  const [sameAsResidence, setSameAsResidence] = useState(false);

  const [admissionNo, setAdmissionNo] = useState('');
  const [studentLastName, setStudentLastName] = useState('');
  const [lookupState, setLookupState] = useState<'idle' | 'searching' | 'found' | 'not-found'>('idle');
  const [matchedStudent, setMatchedStudent] = useState<StudentMatch | null>(null);
  const [claimedStudentName, setClaimedStudentName] = useState('');

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      nickname: '',
      jobTitle: '',
      dateOfBirth: '',
      relationship: '',
      occupation: '',
    },
  });

  const goNext = async () => {
    const fields = STEP_FIELDS[step];
    const valid = fields.length ? await form.trigger(fields) : true;
    if (valid) setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const runLookup = async () => {
    if (!admissionNo.trim() || !studentLastName.trim()) return;
    setLookupState('searching');
    try {
      const { data } = await api.get<StudentMatch | null>('/auth/lookup-student', {
        params: { admissionNo: admissionNo.trim(), lastName: studentLastName.trim() },
      });
      if (data) {
        setMatchedStudent(data);
        setLookupState('found');
      } else {
        setMatchedStudent(null);
        setLookupState('not-found');
      }
    } catch {
      setMatchedStudent(null);
      setLookupState('not-found');
    }
  };

  const onSubmit = async (values: SignupValues) => {
    setServerError(null);
    try {
      await registerParent({
        ...values,
        phone: values.phone || undefined,
        nickname: values.nickname || undefined,
        jobTitle: values.jobTitle || undefined,
        dateOfBirth: values.dateOfBirth || undefined,
        relationship: values.relationship || undefined,
        occupation: values.occupation || undefined,
        residenceLocationId: residence?.villageId || undefined,
        workplaceLocationId: (sameAsResidence ? residence : workplace)?.villageId || undefined,
        requestedStudentId: matchedStudent?.id,
        claimedStudentName: lookupState === 'found' ? undefined : claimedStudentName || undefined,
        claimedAdmissionNo: lookupState === 'found' ? undefined : admissionNo || undefined,
      });
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Registration failed');
    }
  };

  return (
    <div className="auth-shell grid min-h-screen lg:grid-cols-2">
      <AuthShowcasePanel
        title="Join as a parent"
        description="Create an account to stay connected with your child's learning journey at G.S BTR RWAMIKO TSS."
      />
      <div className="relative flex items-center justify-center bg-secondary/30 px-4 py-12">
        <div className="absolute right-4 top-4 lg:hidden"><LanguageSwitcher compact /></div>
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Create a parent account</CardTitle>
            <CardDescription>
              Step {step} of {TOTAL_STEPS} — an administrator will verify your account before you get full access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={(e) => {
                  if (step < TOTAL_STEPS) {
                    e.preventDefault();
                    return;
                  }
                  form.handleSubmit(onSubmit)(e);
                }}
                className="space-y-4"
              >
                {step === 1 && (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="you@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone number</FormLabel>
                          <FormControl>
                            <Input placeholder="078xxxxxxx" {...field} />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            You&apos;ll be able to log in with either your email or this phone number.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="nickname"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nickname (optional)</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of birth</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="relationship"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Relationship to student</FormLabel>
                          <FormControl>
                            <Input placeholder="Mother, Father, Guardian…" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="jobTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job title</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="occupation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Occupation</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Where do you currently live?</p>
                      <LocationPicker value={residence} onChange={setResidence} />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={sameAsResidence}
                          onChange={(e) => setSameAsResidence(e.target.checked)}
                        />
                        My workplace is in the same area as my residence
                      </label>
                      {!sameAsResidence && (
                        <>
                          <p className="text-sm font-medium">Where do you work? (optional)</p>
                          <LocationPicker value={workplace} onChange={setWorkplace} />
                        </>
                      )}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Enter your child&apos;s admission number and last name exactly as they appear on school
                      documents so we can confirm you&apos;re their parent or guardian.
                    </p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Admission number</label>
                        <Input value={admissionNo} onChange={(e) => setAdmissionNo(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Student&apos;s last name</label>
                        <Input value={studentLastName} onChange={(e) => setStudentLastName(e.target.value)} />
                      </div>
                    </div>
                    <Button type="button" variant="outline" onClick={runLookup} disabled={lookupState === 'searching'}>
                      <Search className="size-4" />
                      {lookupState === 'searching' ? 'Searching…' : 'Find my child'}
                    </Button>

                    {lookupState === 'found' && matchedStudent && (
                      <div className="flex items-center gap-2 rounded-md border border-green-600/30 bg-green-600/10 p-3 text-sm">
                        <CheckCircle2 className="size-4 shrink-0 text-green-600" />
                        <span>
                          Found {matchedStudent.firstName} {matchedStudent.lastName}
                          {matchedStudent.className ? ` (${matchedStudent.className})` : ''}. We&apos;ll link your
                          account to this student for admin review.
                        </span>
                      </div>
                    )}

                    {lookupState === 'not-found' && (
                      <div className="space-y-2 rounded-md border border-amber-600/30 bg-amber-600/10 p-3 text-sm">
                        <p>
                          We couldn&apos;t find an exact match. You can still register — an administrator will verify
                          this by hand, which may take longer.
                        </p>
                        <label className="text-sm font-medium">Student&apos;s full name</label>
                        <Input
                          value={claimedStudentName}
                          onChange={(e) => setClaimedStudentName(e.target.value)}
                          placeholder="Full name as enrolled"
                        />
                      </div>
                    )}
                  </div>
                )}

                {serverError && <p className="text-sm text-destructive">{serverError}</p>}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  {step > 1 ? (
                    <Button type="button" variant="ghost" onClick={goBack}>
                      Back
                    </Button>
                  ) : (
                    <span />
                  )}
                  {step < TOTAL_STEPS ? (
                    <Button key="continue" type="button" onClick={goNext}>
                      Continue
                    </Button>
                  ) : (
                    <Button key="submit" type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? 'Creating account…' : 'Create account'}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

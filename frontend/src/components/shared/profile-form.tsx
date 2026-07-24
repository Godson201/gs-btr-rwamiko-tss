'use client';

import { useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Camera } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { LocationPicker, type LocationPickerValue } from '@/components/shared/location-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';

const UPLOADS_BASE_URL = process.env.NEXT_PUBLIC_UPLOADS_BASE_URL ?? '';

const profileSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  nickname: z.string().optional(),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  dateOfBirth: z.string().optional(),
  worksAtAnotherSchool: z.boolean().optional(),
  otherSchoolName: z.string().optional(),
  occupation: z.string().optional(),
  relationship: z.string().optional(),
  emergencyContact: z.string().optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

function locationToValue(
  location: { id: string; province: string; district: string; sector: string; cell: string; village: string } | null | undefined,
): LocationPickerValue | null {
  if (!location) return null;
  return {
    province: location.province,
    district: location.district,
    sector: location.sector,
    cell: location.cell,
    village: location.village,
    villageId: location.id,
  };
}

export function ProfileForm() {
  const { user, refresh } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [residence, setResidence] = useState<LocationPickerValue | null>(locationToValue(user?.residenceLocation));
  const [workplace, setWorkplace] = useState<LocationPickerValue | null>(locationToValue(user?.workplaceLocation));

  const isTeacher = user?.portalAccess?.includes('TEACHER') ?? user?.role === 'TEACHER';
  const isParent = user?.portalAccess?.includes('PARENT') ?? user?.role === 'PARENT';

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      nickname: user?.nickname ?? '',
      phone: user?.phone ?? '',
      jobTitle: user?.jobTitle ?? '',
      dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.slice(0, 10) : '',
      worksAtAnotherSchool: user?.worksAtAnotherSchool ?? false,
      otherSchoolName: user?.otherSchoolName ?? '',
      occupation: user?.parent?.occupation ?? '',
      relationship: user?.parent?.relationship ?? '',
      emergencyContact: '',
    },
  });

  const save = useMutation({
    mutationFn: async (values: ProfileValues) =>
      api.patch('/users/me', {
        firstName: values.firstName,
        lastName: values.lastName,
        nickname: values.nickname || undefined,
        phone: values.phone || undefined,
        jobTitle: values.jobTitle || undefined,
        dateOfBirth: values.dateOfBirth || undefined,
        residenceLocationId: residence?.villageId || undefined,
        workplaceLocationId: workplace?.villageId || undefined,
        teacher: isTeacher
          ? { worksAtAnotherSchool: values.worksAtAnotherSchool, otherSchoolName: values.otherSchoolName || undefined }
          : undefined,
        parent: isParent
          ? {
              occupation: values.occupation || undefined,
              relationship: values.relationship || undefined,
              emergencyContact: values.emergencyContact || undefined,
            }
          : undefined,
      }),
    onSuccess: async () => {
      toast.success('Profile updated');
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/users/me/avatar', formData);
    },
    onSuccess: async () => {
      toast.success('Photo updated');
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const avatarSrc = user?.avatar ? `${UPLOADS_BASE_URL}${user.avatar}` : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile photo</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative size-20 shrink-0 overflow-hidden rounded-full border bg-secondary"
          >
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarSrc} alt="Profile" className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center text-lg font-semibold text-muted-foreground">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="size-5 text-white" />
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadAvatar.mutate(file);
              e.target.value = '';
            }}
          />
          <div>
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              {uploadAvatar.isPending ? 'Uploading…' : 'Change photo'}
            </Button>
            <p className="mt-1 text-xs text-muted-foreground">JPG or PNG, up to 5MB.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => save.mutate(values))} className="space-y-4">
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
                <FormField
                  control={form.control}
                  name="nickname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nickname</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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

              {isTeacher && (
                <div className="space-y-3 rounded-md border p-4">
                  <p className="text-sm font-medium">Teacher details</p>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" {...form.register('worksAtAnotherSchool')} />
                    I also teach at another school
                  </label>
                  {form.watch('worksAtAnotherSchool') && (
                    <FormField
                      control={form.control}
                      name="otherSchoolName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Other school name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}

              {isParent && (
                <div className="space-y-4 rounded-md border p-4">
                  <p className="text-sm font-medium">Parent / guardian details</p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="relationship"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Relationship to student</FormLabel>
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
                    <FormField
                      control={form.control}
                      name="emergencyContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency contact</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">Residence</p>
                <LocationPicker value={residence} onChange={setResidence} />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Workplace</p>
                <LocationPicker value={workplace} onChange={setWorkplace} />
              </div>

              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

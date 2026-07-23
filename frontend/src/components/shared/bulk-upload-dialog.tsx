'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';

interface BulkImportResult {
  created: { row: number; [key: string]: unknown }[];
  failed: { row: number; error: string }[];
}

interface BulkUploadDialogProps {
  title: string;
  description: string;
  endpoint: string;
  invalidateKeys: string[];
  createdLabel: (row: { row: number; [key: string]: unknown }) => string;
}

export function BulkUploadDialog({
  title,
  description,
  endpoint,
  invalidateKeys,
  createdLabel,
}: BulkUploadDialogProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<BulkImportResult | null>(null);

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Choose a file first');
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post<BulkImportResult>(endpoint, formData);
      return data;
    },
    onSuccess: (data) => {
      setResult(data);
      invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
      if (data.failed.length === 0) {
        toast.success(`${data.created.length} record(s) imported`);
      } else {
        toast.warning(`${data.created.length} imported, ${data.failed.length} failed`);
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setFile(null);
          setResult(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="size-4" />
          Bulk Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setResult(null);
          }}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-sm"
        />

        {result && (
          <div className="space-y-2 rounded-md border p-3 text-sm">
            <p className="font-medium text-primary">{result.created.length} created</p>
            {result.created.length > 0 && (
              <ul className="max-h-32 space-y-0.5 overflow-y-auto text-xs text-muted-foreground">
                {result.created.map((row) => (
                  <li key={row.row}>
                    Row {row.row}: {createdLabel(row)}
                  </li>
                ))}
              </ul>
            )}
            {result.failed.length > 0 && (
              <>
                <p className="font-medium text-destructive">{result.failed.length} failed</p>
                <ul className="max-h-32 space-y-0.5 overflow-y-auto text-xs text-destructive">
                  {result.failed.map((row) => (
                    <li key={row.row}>
                      Row {row.row}: {row.error}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => upload.mutate()} disabled={!file || upload.isPending}>
            {upload.isPending ? 'Uploading…' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, Send, Square, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function VoiceRecorderButton({ onRecorded }: { onRecorded: (file: File) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordedFileRef = useRef<File | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const recorder = mediaRecorderRef.current;
      if (recorder) {
        recorder.onstop = null;
        if (recorder.state !== 'inactive') recorder.stop();
      }
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mountedRef.current) { stream.getTracks().forEach(track => track.stop()); return; }
      streamRef.current = stream;
      const mimeType = ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
        .find(type => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const actualType = (recorder.mimeType || chunksRef.current[0]?.type || mimeType || '').split(';')[0];
        const extension = actualType.includes('mp4') ? 'm4a' : actualType.includes('ogg') ? 'ogg' : 'webm';
        const blob = new Blob(chunksRef.current, { type: actualType });
        recordedFileRef.current = new File([blob], `voice-note-${Date.now()}.${extension}`, {
          type: actualType,
        });
        setPreviewUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      streamRef.current?.getTracks().forEach(track => track.stop());
      toast.error('Unable to record. Allow microphone access and use a browser that supports voice recording.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const discard = () => {
    setPreviewUrl(null);
    recordedFileRef.current = null;
  };

  const send = () => {
    if (recordedFileRef.current) {
      onRecorded(recordedFileRef.current);
      discard();
    }
  };

  if (previewUrl) {
    return (
      <div className="flex items-center gap-1">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio src={previewUrl} controls className="h-8 max-w-40" />
        <Button type="button" variant="ghost" size="icon" onClick={discard} title="Discard">
          <Trash2 className="size-4 text-destructive" />
        </Button>
        <Button type="button" size="icon" onClick={send} title="Attach voice note">
          <Send className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      key={isRecording ? 'recording' : 'idle'}
      type="button"
      variant={isRecording ? 'destructive' : 'outline'}
      size="icon"
      onClick={isRecording ? stopRecording : startRecording}
      aria-pressed={isRecording}
      title={isRecording ? 'Stop recording' : 'Record a voice note'}
    >
      {isRecording ? <Square className="size-4" /> : <Mic className="size-4" />}
    </Button>
  );
}

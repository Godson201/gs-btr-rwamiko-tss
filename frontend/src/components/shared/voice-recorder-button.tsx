'use client';

import { useRef, useState } from 'react';
import { Mic, Send, Square, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function VoiceRecorderButton({ onRecorded }: { onRecorded: (file: File) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordedFileRef = useRef<File | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        recordedFileRef.current = new File([blob], `voice-note-${Date.now()}.webm`, {
          type: 'audio/webm',
        });
        setPreviewUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      toast.error('Microphone access is required to record a voice note');
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
      type="button"
      variant={isRecording ? 'destructive' : 'outline'}
      size="icon"
      onClick={isRecording ? stopRecording : startRecording}
      title={isRecording ? 'Stop recording' : 'Record a voice note'}
    >
      {isRecording ? <Square className="size-4" /> : <Mic className="size-4" />}
    </Button>
  );
}

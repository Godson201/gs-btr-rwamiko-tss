import { MessageThread } from '@/components/shared/message-thread';

export default function ParentMessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Messages</h2>
        <p className="text-sm text-muted-foreground">Chat with the school administration</p>
      </div>
      <MessageThread
        fetchUrl="/messages/my-conversation"
        postUrl="/messages/my-conversation"
        queryKey={['my-conversation']}
      />
    </div>
  );
}

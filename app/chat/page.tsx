import { currentUser } from "@clerk/nextjs/server";
import ChatInterface from "@/components/ChatInterface";

export default async function ChatPage() {
  const user = await currentUser();
  const plan = (user?.publicMetadata?.plan as string) ?? "free";
  return <ChatInterface plan={plan} />;
}

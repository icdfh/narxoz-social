import { useParams } from "react-router-dom";
import ErrorBoundary from "../components/ErrorBoundary";
import ChatRoom from "../components/chat/ChatRoom";

const DirectChat = () => {
  const { chatId } = useParams();

  return (
    <ErrorBoundary>
      <ChatRoom key={chatId} chatId={chatId} />
    </ErrorBoundary>
  );
};

export default DirectChat;

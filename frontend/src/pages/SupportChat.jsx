import {
  Clock3,
  Headset,
  MessageSquare,
  Package,
  Plus,
  SendHorizontal,
  ShieldCheck,
  Ticket,
  UserCircle2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import useCustomerAuth from "../context/useCustomerAuth";
import {
  getOrders,
  getSupportChatsForEmail,
  getSupportTicketsForEmail,
  getOrCreateSupportChat,
  markSupportChatAsRead,
  syncOrders,
  syncSupportChats,
  syncSupportTickets,
  sendSupportChatMessage,
} from "../lib/marketplaceStore";
import { supportApi } from "../services/api";

const supportCategories = [
  "Order Issue",
  "Delivery Delay",
  "Product Quality",
  "Refund and Return",
  "Payment Problem",
  "General Support",
];

const quickPrompts = [
  "Where is my order?",
  "I received a damaged item",
  "I need help with refund eligibility",
  "Payment was deducted twice",
  "I want to talk to an agent",
];

const statusClasses = {
  Active: "bg-emerald-100 text-emerald-700",
  "In Review": "bg-cyan-100 text-cyan-700",
  Resolved: "bg-slate-200 text-slate-700",
  Closed: "bg-slate-200 text-slate-700",
};
const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;

const isWaitingForAgent = (chat) => {
  return Number(chat?.unreadForAdmin) > 0 && chat?.status !== "Closed";
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Attachment upload failed."));
    reader.readAsDataURL(file);
  });

const formatTimestamp = (value) =>
  new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

function SupportChat() {
  const { customer } = useCustomerAuth();
  const [searchParams] = useSearchParams();
  const queryOrderId = searchParams.get("order") || "";
  const queryTicketId = searchParams.get("ticket") || "";
  const lastOrderEmail = localStorage.getItem("CampusBasket-last-order-email") || "";
  const defaultEmail = customer?.email || lastOrderEmail;
  const defaultName = customer?.name || "";

  const [chatSetup, setChatSetup] = useState({
    customerName: defaultName,
    customerEmail: defaultEmail,
    orderId: queryOrderId,
    ticketId: queryTicketId,
    category: "Order Issue",
    subject: queryOrderId
      ? `Support for order ${queryOrderId}`
      : "General Support Chat",
  });
  const [draftMessage, setDraftMessage] = useState("");
  const [attachmentDraft, setAttachmentDraft] = useState(null);
  const [attachmentError, setAttachmentError] = useState("");
  const [chatState, setChatState] = useState({
    conversations: [],
    selectedChatId: null,
  });

  const orders = useMemo(
    () =>
      getOrders()
        .filter((order) => {
          const orderEmail = order.customer?.email || order.shipping?.email || "";
          return chatSetup.customerEmail
            ? orderEmail.toLowerCase() === chatSetup.customerEmail.toLowerCase()
            : false;
        })
        .sort(
          (firstOrder, secondOrder) =>
            new Date(secondOrder.date) - new Date(firstOrder.date),
        ),
    [chatSetup.customerEmail],
  );

  const supportTickets = useMemo(
    () => getSupportTicketsForEmail(chatSetup.customerEmail.trim()),
    [chatSetup.customerEmail],
  );

  const selectedConversation =
    chatState.conversations.find((chat) => chat.id === chatState.selectedChatId) ||
    null;

  const activeConversations = chatState.conversations.filter(
    (chat) => !["Resolved", "Closed"].includes(chat.status),
  ).length;

  const refreshConversations = async (email, preferredChatId = null) => {
    if (!email.trim()) {
      setChatState({
        conversations: [],
        selectedChatId: null,
      });
      return;
    }

    await Promise.all([
      syncOrders(email.trim()),
      syncSupportTickets(email.trim()),
      syncSupportChats(email.trim()),
    ]);

    const conversations = getSupportChatsForEmail(email.trim());
    setChatState({
      conversations,
      selectedChatId: preferredChatId || conversations[0]?.id || null,
    });
  };

  useEffect(() => {
    const bootstrapChat = async () => {
      if (!defaultEmail) {
        return;
      }

      await refreshConversations(defaultEmail);

      if (queryOrderId || queryTicketId) {
        const preparedChat = await getOrCreateSupportChat({
          customerName: defaultName,
          customerEmail: defaultEmail,
          orderId: queryOrderId,
          ticketId: queryTicketId,
          category: "Order Issue",
          subject: queryOrderId
            ? `Support for order ${queryOrderId}`
            : "General Support Chat",
        });

        await refreshConversations(defaultEmail, preparedChat.id);
      }
    };

    void bootstrapChat();
  }, [defaultEmail, defaultName, queryOrderId, queryTicketId]);

  useEffect(() => {
    if (!chatSetup.customerEmail.trim()) {
      return undefined;
    }

    const stream = new EventSource(
      supportApi.customerStreamUrl(chatSetup.customerEmail.trim()),
    );
    const handleSupportUpdate = () => {
      void refreshConversations(chatSetup.customerEmail, chatState.selectedChatId);
    };

    stream.addEventListener("support-update", handleSupportUpdate);

    return () => {
      stream.removeEventListener("support-update", handleSupportUpdate);
      stream.close();
    };
  }, [chatSetup.customerEmail, chatState.selectedChatId]);

  useEffect(() => {
    if (!selectedConversation?.id || selectedConversation.unreadForCustomer <= 0) {
      return;
    }

    void markSupportChatAsRead(selectedConversation.id, chatSetup.customerEmail).then(
      (updatedChat) => {
        setChatState((currentState) => ({
          ...currentState,
          conversations: currentState.conversations.map((chat) =>
            chat.id === updatedChat.id ? updatedChat : chat,
          ),
        }));
      },
    ).catch(() => {});
  }, [chatSetup.customerEmail, selectedConversation?.id, selectedConversation?.unreadForCustomer]);

  const handleSetupChange = (event) => {
    const { name, value } = event.target;

    if (name === "ticketId") {
      const selectedTicket = supportTickets.find((ticket) => ticket.id === value);

      setChatSetup((currentSetup) => ({
        ...currentSetup,
        ticketId: value,
        orderId: selectedTicket?.orderId || currentSetup.orderId,
        category: selectedTicket?.category || currentSetup.category,
        subject: selectedTicket?.subject || currentSetup.subject,
      }));
      return;
    }

    setChatSetup((currentSetup) => ({
      ...currentSetup,
      [name]: value,
    }));

    if (name === "customerEmail") {
      void refreshConversations(value, null);
    }
  };

  const handleCreateChat = async () => {
    if (!chatSetup.customerEmail.trim() || !chatSetup.subject.trim()) {
      return;
    }

    const chat = await getOrCreateSupportChat(chatSetup);
    await refreshConversations(chatSetup.customerEmail, chat.id);
  };

  const handleAttachmentChange = async (event) => {
    const file = event.target.files?.[0];

    setAttachmentError("");
    event.target.value = "";

    if (!file) {
      return;
    }

    if (file.size > MAX_ATTACHMENT_BYTES) {
      setAttachmentError("Attachments must be 2 MB or smaller.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setAttachmentDraft({
        url: dataUrl,
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      });
    } catch {
      setAttachmentError("Attachment upload failed. Please try another file.");
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if ((!draftMessage.trim() && !attachmentDraft) || !chatSetup.customerEmail.trim()) {
      return;
    }

    let activeChatId = chatState.selectedChatId;

    if (!activeChatId) {
      const createdChat = await getOrCreateSupportChat(chatSetup);
      activeChatId = createdChat.id;
    }

    const updatedConversation = await sendSupportChatMessage(activeChatId, {
      senderName: chatSetup.customerName || customer?.name || "Customer",
      customerEmail: chatSetup.customerEmail,
      text: draftMessage,
      attachment: attachmentDraft || undefined,
    });

    await refreshConversations(
      chatSetup.customerEmail,
      updatedConversation?.id || activeChatId,
    );
    setDraftMessage("");
    setAttachmentDraft(null);
    setAttachmentError("");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.12),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#edf4ff_52%,_#f8fafc_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 px-6 py-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr),360px] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
                Live Support Chat
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight">
                Continue your issue with CampusBasket Care in a dedicated chat thread.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                Start a conversation, connect it to an order or complaint, and keep
                every support update together in one clean customer-service inbox.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/support"
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                >
                  Complaint Center
                </Link>
                <Link
                  to="/orders"
                  className="rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.1]"
                >
                  View My Orders
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Active Chats
                </p>
                <p className="mt-2 text-2xl font-bold">{activeConversations}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Tickets Linked
                </p>
                <p className="mt-2 text-2xl font-bold">{supportTickets.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Orders Ready
                </p>
                <p className="mt-2 text-2xl font-bold">{orders.length}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[340px,minmax(0,1fr)]">
          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                  <Headset size={22} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Start Chat
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    Open a support thread
                  </h2>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Name</span>
                  <input
                    type="text"
                    name="customerName"
                    value={chatSetup.customerName}
                    onChange={handleSetupChange}
                    placeholder="Your name"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-400"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Email</span>
                  <input
                    type="email"
                    name="customerEmail"
                    value={chatSetup.customerEmail}
                    onChange={handleSetupChange}
                    placeholder="your@email.com"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-400"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Order</span>
                  <select
                    name="orderId"
                    value={chatSetup.orderId}
                    onChange={handleSetupChange}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-400"
                  >
                    <option value="">No order linked</option>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.id} - {order.shipping?.city || "CampusBasket order"}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Complaint Ticket
                  </span>
                  <select
                    name="ticketId"
                    value={chatSetup.ticketId}
                    onChange={handleSetupChange}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-400"
                  >
                    <option value="">No ticket linked</option>
                    {supportTickets.map((ticket) => (
                      <option key={ticket.id} value={ticket.id}>
                        {ticket.ticketNumber} - {ticket.subject}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Category
                  </span>
                  <select
                    name="category"
                    value={chatSetup.category}
                    onChange={handleSetupChange}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-400"
                  >
                    {supportCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Subject
                  </span>
                  <input
                    type="text"
                    name="subject"
                    value={chatSetup.subject}
                    onChange={handleSetupChange}
                    placeholder="What do you need help with?"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-400"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleCreateChat}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Plus size={16} />
                  Start or Resume Chat
                </button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Conversations
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    Recent support chats
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {chatState.conversations.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm leading-7 text-slate-500">
                    Enter your email and start a support thread to see chat history here.
                  </div>
                ) : (
                  chatState.conversations.map((chat) => (
                    <button
                      key={chat.id}
                      type="button"
                      onClick={() =>
                        setChatState((currentState) => ({
                          ...currentState,
                          selectedChatId: chat.id,
                        }))
                      }
                      className={`w-full rounded-3xl border p-4 text-left transition ${
                        chat.id === chatState.selectedChatId
                          ? "border-cyan-300 bg-cyan-50"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      {isWaitingForAgent(chat) && (
                        <div className="mb-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
                          Waiting for agent reply
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-3">
                        <p className="line-clamp-1 text-sm font-semibold text-slate-950">
                          {chat.subject}
                        </p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClasses[chat.status] || "bg-slate-200 text-slate-700"}`}
                        >
                          {chat.status}
                        </span>
                      </div>
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                        {chat.orderId ? `Order ${chat.orderId}` : chat.category}
                      </p>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
                        {chat.messages?.[chat.messages.length - 1]?.text ||
                          (chat.messages?.[chat.messages.length - 1]?.attachmentUrl
                            ? "Attachment shared"
                            : "No messages yet")}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </aside>

          <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            {selectedConversation ? (
              <div className="flex h-full min-h-[720px] flex-col">
                <div className="border-b border-slate-200 px-6 py-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                        Active Conversation
                      </p>
                      <h2 className="mt-2 text-3xl font-black text-slate-950">
                        {selectedConversation.subject}
                      </h2>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-2">
                          <Headset size={16} className="text-cyan-600" />
                          {selectedConversation.assignedAgent}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Clock3 size={16} className="text-amber-500" />
                          Updated {formatTimestamp(selectedConversation.updatedAt)}
                        </span>
                        {selectedConversation.orderId && (
                          <span className="inline-flex items-center gap-2">
                            <Package size={16} className="text-emerald-600" />
                            {selectedConversation.orderId}
                          </span>
                        )}
                        {selectedConversation.ticketId && (
                          <span className="inline-flex items-center gap-2">
                            <Ticket size={16} className="text-violet-600" />
                            {selectedConversation.ticketId}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          Status
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-950">
                          {selectedConversation.status}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          Category
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-950">
                          {selectedConversation.category}
                        </p>
                      </div>
                    </div>
                  </div>

                  {isWaitingForAgent(selectedConversation) && (
                    <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      Your latest message is in the admin queue. A real support agent will reply from the support desk.
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
                  {selectedConversation.messages?.map((message) => {
                    const isCustomer = message.senderType === "customer";

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-full rounded-[1.5rem] px-4 py-4 shadow-sm sm:max-w-2xl sm:px-5 ${
                            isCustomer
                              ? "bg-slate-950 text-white"
                              : "border border-slate-200 bg-slate-50 text-slate-900"
                          }`}
                        >
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]">
                            {isCustomer ? (
                              <UserCircle2 size={14} className="text-slate-300" />
                            ) : (
                              <ShieldCheck size={14} className="text-emerald-500" />
                            )}
                            <span className={isCustomer ? "text-slate-300" : "text-slate-500"}>
                              {message.senderName}
                            </span>
                          </div>
                          <p className="mt-3 text-sm leading-7">{message.text}</p>
                          {message.attachmentUrl && (
                            <div className="mt-3 rounded-2xl border border-slate-200/70 bg-white/80 p-3">
                              {message.attachmentMimeType?.startsWith("image/") && (
                                <img
                                  src={message.attachmentUrl}
                                  alt={message.attachmentName || "Support attachment"}
                                  className="max-h-52 rounded-xl object-cover"
                                />
                              )}
                              <a
                                href={message.attachmentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 hover:text-cyan-600"
                              >
                                {message.attachmentName || "Open attachment"}
                              </a>
                            </div>
                          )}
                          <p
                            className={`mt-3 text-[11px] font-medium ${
                              isCustomer ? "text-slate-400" : "text-slate-400"
                            }`}
                          >
                            {formatTimestamp(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-slate-200 px-6 py-5">
                  <div className="mb-4 flex flex-wrap gap-2">
                    {quickPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => setDraftMessage(prompt)}
                        className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSendMessage} className="flex flex-col gap-3 lg:flex-row">
                    <textarea
                      rows={3}
                      value={draftMessage}
                      onChange={(event) => setDraftMessage(event.target.value)}
                      placeholder="Type your message to CampusBasket Care"
                      className="min-h-[88px] flex-1 rounded-[1.5rem] border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-400"
                    />
                    <div className="flex w-full flex-col gap-3 lg:w-auto">
                      <label className="inline-flex cursor-pointer items-center justify-center rounded-[1.2rem] border border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 transition hover:border-slate-300 hover:bg-slate-100">
                        Attach File
                        <input
                          type="file"
                          onChange={handleAttachmentChange}
                          accept="image/*,.pdf,.txt,.doc,.docx"
                          className="hidden"
                        />
                      </label>
                      <button className="inline-flex items-center justify-center gap-2 rounded-[1.5rem] bg-cyan-500 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                        <SendHorizontal size={18} />
                        Send Message
                      </button>
                    </div>
                  </form>
                  {attachmentDraft && (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <span className="line-clamp-1">
                        Attached: <span className="font-semibold text-slate-900">{attachmentDraft.name}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setAttachmentDraft(null)}
                        className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 transition hover:border-slate-400"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  {attachmentError && (
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-rose-600">
                      {attachmentError}
                    </p>
                  )}
                  <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">
                    The support assistant can answer basic questions first. Reply "agent" any time to move this chat to a human.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[720px] flex-col items-center justify-center px-6 py-12 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <MessageSquare size={30} />
                </div>
                <h2 className="mt-6 text-3xl font-black text-slate-950">
                  Start a support chat when you are ready.
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500">
                  Add your email and a short subject on the left, then open a new
                  thread to talk with CampusBasket Care about orders, refunds, payment,
                  or product issues.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default SupportChat;

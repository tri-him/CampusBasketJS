import {
  CircleCheckBig,
  Clock3,
  Headset,
  MessageSquare,
  Search,
  SendHorizontal,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../context/useAuth";
import { supportApi } from "../services/api";

const ticketStatusOptions = ["OPEN", "IN_REVIEW", "RESOLVED"];
const chatStatusOptions = ["ACTIVE", "IN_REVIEW", "CLOSED"];
const priorityOptions = ["HIGH", "MEDIUM", "LOW"];
const defaultFilters = {
  search: "",
  ticketStatus: "",
  ticketPriority: "",
  chatStatus: "",
};
const prioritySlaHours = {
  HIGH: 2,
  MEDIUM: 8,
  LOW: 24,
};
const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;

const toTitleCase = (value) =>
  String(value || "")
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");

const formatDate = (value) =>
  new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const normalizeAdminChat = (chat) => ({
  ...chat,
  assignedAgentName: chat.assignedAgentName || "CampusBasket Support Admin",
  unreadForAdmin: Number(chat.unreadForAdmin) || 0,
  unreadForCustomer: Number(chat.unreadForCustomer) || 0,
  assignedAgentId: chat.assignedAgentId || "",
  assignedAt: chat.assignedAt || null,
  messages: (chat.messages || []).map((message) => ({
    ...message,
    senderType: String(message.senderType || "").trim().toLowerCase(),
  })),
});

const isWaitingForAgent = (chat) => {
  return Number(chat?.unreadForAdmin) > 0 && chat?.status !== "CLOSED";
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Attachment upload failed."));
    reader.readAsDataURL(file);
  });

const getTicketSla = (ticket) => {
  if (!ticket) {
    return null;
  }

  if (ticket.status === "RESOLVED") {
    return {
      label: "Resolved",
      tone: "bg-emerald-100 text-emerald-700",
    };
  }

  const createdAt = new Date(ticket.createdAt).getTime();
  const deadline =
    createdAt +
    (prioritySlaHours[String(ticket.priority || "MEDIUM").toUpperCase()] || 8) *
      60 *
      60 *
      1000;
  const remainingMs = deadline - Date.now();

  if (remainingMs <= 0) {
    return {
      label: "SLA Overdue",
      tone: "bg-rose-100 text-rose-700",
    };
  }

  if (remainingMs <= 60 * 60 * 1000) {
    return {
      label: "Due Soon",
      tone: "bg-amber-100 text-amber-700",
    };
  }

  return {
    label: "On Track",
    tone: "bg-cyan-100 text-cyan-700",
  };
};

function SupportDesk() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [chats, setChats] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [replyAttachment, setReplyAttachment] = useState(null);
  const [replyAttachmentError, setReplyAttachmentError] = useState("");
  const [agentName, setAgentName] = useState(user?.name || "CampusBasket Support Admin");
  const [closeTicketOnReply, setCloseTicketOnReply] = useState(false);

  const loadSupportDesk = useCallback(
    async (nextFilters = filters) => {
      const [overviewResponse, ticketsResponse, chatsResponse] = await Promise.all([
        supportApi.adminOverview(),
        supportApi.adminTickets({
          search: nextFilters.search,
          status: nextFilters.ticketStatus,
          priority: nextFilters.ticketPriority,
        }),
        supportApi.adminChats({
          search: nextFilters.search,
          status: nextFilters.chatStatus,
        }),
      ]);
      const normalizedChats = (chatsResponse.data || []).map(normalizeAdminChat);

      setOverview(overviewResponse.data);
      setTickets(ticketsResponse.data || []);
      setChats(normalizedChats);

      setSelectedChatId((currentSelectedChatId) => {
        if (
          currentSelectedChatId &&
          normalizedChats.some((chat) => chat.id === currentSelectedChatId)
        ) {
          return currentSelectedChatId;
        }

        return normalizedChats[0]?.id || null;
      });
    },
    [filters],
  );

  useEffect(() => {
    let cancelled = false;

    if (user?.role !== "ADMIN") {
      return undefined;
    }

    const bootstrapSupportDesk = async () => {
      const [overviewResponse, ticketsResponse, chatsResponse] = await Promise.all([
        supportApi.adminOverview(),
        supportApi.adminTickets({
          search: defaultFilters.search,
          status: defaultFilters.ticketStatus,
          priority: defaultFilters.ticketPriority,
        }),
        supportApi.adminChats({
          search: defaultFilters.search,
          status: defaultFilters.chatStatus,
        }),
      ]);

      if (cancelled) {
        return;
      }

      const normalizedChats = (chatsResponse.data || []).map(normalizeAdminChat);
      setOverview(overviewResponse.data);
      setTickets(ticketsResponse.data || []);
      setChats(normalizedChats);
      setSelectedChatId(normalizedChats[0]?.id || null);
    };

    void bootstrapSupportDesk();

    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== "ADMIN") {
      return undefined;
    }

    const stream = new EventSource(supportApi.adminStreamUrl());
    const handleSupportUpdate = () => {
      void loadSupportDesk();
    };

    stream.addEventListener("support-update", handleSupportUpdate);

    return () => {
      stream.removeEventListener("support-update", handleSupportUpdate);
      stream.close();
    };
  }, [loadSupportDesk, user?.role]);

  useEffect(() => {
    if (!selectedChatId || user?.role !== "ADMIN") {
      return;
    }

    void supportApi.markAdminChatRead(selectedChatId).then((response) => {
      const updatedChat = normalizeAdminChat(response.data);
      setChats((currentChats) =>
        currentChats.map((chat) => (chat.id === updatedChat.id ? updatedChat : chat)),
      );
    }).catch(() => {});
  }, [selectedChatId, user?.role]);

  const selectedChat = useMemo(
    () => chats.find((chat) => chat.id === selectedChatId) || null,
    [chats, selectedChatId],
  );

  const linkedTicket = useMemo(() => {
    if (!selectedChat?.ticketId) {
      return null;
    }

    return (
      tickets.find((ticket) => ticket.id === selectedChat.ticketId) ||
      selectedChat.ticket ||
      null
    );
  }, [selectedChat, tickets]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    const nextFilters = {
      ...filters,
      [name]: value,
    };

    setFilters(nextFilters);
    void loadSupportDesk(nextFilters);
  };

  const handleTicketStatusChange = async (ticketId, status) => {
    await supportApi.updateAdminTicket(ticketId, {
      status,
      responseEta: status === "RESOLVED" ? "Resolved" : undefined,
    });
    await loadSupportDesk();
  };

  const handleChatStatusChange = async (chatId, status) => {
    await supportApi.updateAdminChat(chatId, {
      status,
      assignedAgentName: agentName.trim() || user?.name || "CampusBasket Support Admin",
      assignedAgentId: user?.id || undefined,
    });
    await loadSupportDesk();
  };

  const handleAttachmentChange = async (event) => {
    const file = event.target.files?.[0];

    setReplyAttachmentError("");
    event.target.value = "";

    if (!file) {
      return;
    }

    if (file.size > MAX_ATTACHMENT_BYTES) {
      setReplyAttachmentError("Attachments must be 2 MB or smaller.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setReplyAttachment({
        url: dataUrl,
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      });
    } catch {
      setReplyAttachmentError("Attachment upload failed. Please try another file.");
    }
  };

  const handleSendReply = async (event) => {
    event.preventDefault();

    if (!selectedChat || (!replyDraft.trim() && !replyAttachment)) {
      return;
    }

    await supportApi.sendAdminMessage(selectedChat.id, {
      text: replyDraft,
      senderName: agentName.trim() || user?.name || "CampusBasket Support Admin",
      senderId: user?.id || undefined,
      closeTicket: closeTicketOnReply,
      attachment: replyAttachment || undefined,
    });

    setReplyDraft("");
    setReplyAttachment(null);
    setReplyAttachmentError("");
    setCloseTicketOnReply(false);
    await loadSupportDesk();
  };

  const statCards = [
    {
      label: "Open Tickets",
      value: overview?.tickets?.open || 0,
      helper: `${overview?.tickets?.total || 0} total`,
      icon: Ticket,
      accent: "bg-amber-100 text-amber-700",
    },
    {
      label: "Waiting Chats",
      value: overview?.chats?.waitingForAgent || 0,
      helper: "Need an agent response",
      icon: MessageSquare,
      accent: "bg-cyan-100 text-cyan-700",
    },
    {
      label: "Resolved Tickets",
      value: overview?.tickets?.resolved || 0,
      helper: "Closed successfully",
      icon: CircleCheckBig,
      accent: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Active Chats",
      value: overview?.chats?.active || 0,
      helper: "Live customer threads",
      icon: Headset,
      accent: "bg-rose-100 text-rose-700",
    },
  ];

  if (user?.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 px-6 py-8 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr),360px]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
              Admin Support Workspace
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Keep CampusBasket customer issues moving with one unified queue.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              Review complaints, monitor chat threads, update ticket statuses,
              and reply as a support agent from one admin workspace.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Agent Identity
            </p>
            <input
              type="text"
              value={agentName}
              onChange={(event) => setAgentName(event.target.value)}
              className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300"
            />
            <p className="mt-3 text-sm text-slate-400">
              Replies from this workspace will use the agent name above.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {statCards.map((card) => {
          const StatIcon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">{card.label}</p>
                  <p className="mt-3 text-3xl font-black text-slate-950">{card.value}</p>
                </div>
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.accent}`}
                >
                  <StatIcon size={22} />
                </span>
              </div>
              <p className="mt-4 text-sm text-slate-500">{card.helper}</p>
            </div>
          );
        })}
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Queue Filters
            </p>
            <h3 className="mt-2 text-2xl font-black text-slate-950">
              Narrow the support queue
            </h3>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <div className="relative w-full min-w-0 sm:min-w-[260px]">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                name="search"
                placeholder="Search ticket, customer, subject"
                value={filters.search}
                onChange={handleFilterChange}
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-cyan-400"
              />
            </div>

            <select
              name="ticketStatus"
              value={filters.ticketStatus}
              onChange={handleFilterChange}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-cyan-400"
            >
              <option value="">All ticket statuses</option>
              {ticketStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {toTitleCase(status)}
                </option>
              ))}
            </select>

            <select
              name="ticketPriority"
              value={filters.ticketPriority}
              onChange={handleFilterChange}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-cyan-400"
            >
              <option value="">All priorities</option>
              {priorityOptions.map((priority) => (
                <option key={priority} value={priority}>
                  {toTitleCase(priority)}
                </option>
              ))}
            </select>

            <select
              name="chatStatus"
              value={filters.chatStatus}
              onChange={handleFilterChange}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-cyan-400"
            >
              <option value="">All chat statuses</option>
              {chatStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {toTitleCase(status)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[360px,360px,minmax(0,1fr)]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-slate-950">Tickets</h3>
              <p className="mt-1 text-sm text-slate-500">
                Complaint queue with quick status controls.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {tickets.length}
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {tickets.map((ticket) => {
              const sla = getTicketSla(ticket);

              return (
                <article
                  key={ticket.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      {toTitleCase(ticket.priority)}
                    </span>
                    <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
                      {toTitleCase(ticket.status)}
                    </span>
                    {sla && (
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${sla.tone}`}>
                        {sla.label}
                      </span>
                    )}
                  </div>

                  <h4 className="mt-4 text-lg font-bold text-slate-950">{ticket.subject}</h4>
                  <p className="mt-2 text-sm text-slate-500">
                    {ticket.customerName} | {ticket.customerEmail}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{ticket.description}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">
                    {ticket.ticketNumber} | {ticket.order?.orderNumber || "No order"} |{" "}
                    {formatDate(ticket.updatedAt)}
                  </p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {ticket.responseEta}
                  </p>

                  <div className="mt-4 flex flex-col gap-3">
                    <select
                      value={ticket.status}
                      onChange={(event) =>
                        void handleTicketStatusChange(ticket.id, event.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-cyan-400"
                    >
                      {ticketStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {toTitleCase(status)}
                        </option>
                      ))}
                    </select>

                    {ticket.chat?.id && (
                      <button
                        type="button"
                        onClick={() => setSelectedChatId(ticket.chat.id)}
                        className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        Open Linked Chat
                      </button>
                    )}
                  </div>
                </article>
              );
            })}

            {tickets.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
                No tickets match the current filters.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-slate-950">Chats</h3>
              <p className="mt-1 text-sm text-slate-500">
                Active support conversations ready for admin reply.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {chats.length}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {chats.map((chat) => (
              <button
                key={chat.id}
                type="button"
                onClick={() => setSelectedChatId(chat.id)}
                className={`w-full rounded-3xl border p-4 text-left transition ${
                  chat.id === selectedChatId
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
                  <div className="flex items-center gap-2">
                    {chat.unreadForAdmin > 0 && (
                      <span className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-semibold text-rose-700">
                        {chat.unreadForAdmin} unread
                      </span>
                    )}
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-700">
                      {toTitleCase(chat.status)}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {chat.customerName} | {chat.customerEmail}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                  Owner: {chat.assignedAgentName}
                </p>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
                  {chat.messages?.[chat.messages.length - 1]?.text ||
                    (chat.messages?.[chat.messages.length - 1]?.attachmentUrl
                      ? "Attachment shared"
                      : "No messages yet")}
                </p>
              </button>
            ))}

            {chats.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
                No support chats match the current filters.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
          {selectedChat ? (
            <div className="flex h-full min-h-[620px] flex-col md:min-h-[760px]">
              <div className="border-b border-slate-200 px-4 py-5 sm:px-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Conversation Workspace
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-slate-950">
                      {selectedChat.subject}
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                      <span>{selectedChat.chatNumber}</span>
                      <span>{selectedChat.customerName}</span>
                      <span>{selectedChat.customerEmail}</span>
                      <span>{selectedChat.order?.orderNumber || "No linked order"}</span>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      value={selectedChat.status}
                      onChange={(event) =>
                        void handleChatStatusChange(selectedChat.id, event.target.value)
                      }
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-cyan-400"
                    >
                      {chatStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {toTitleCase(status)}
                        </option>
                      ))}
                    </select>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      Assigned agent
                      <p className="mt-2 font-semibold text-slate-950">
                        {selectedChat.assignedAgentName}
                      </p>
                    </div>
                  </div>
                </div>

                {isWaitingForAgent(selectedChat) && (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    This conversation is waiting for an admin reply from the support queue.
                  </div>
                )}

                {linkedTicket && (
                  <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <ShieldCheck size={18} className="text-cyan-700" />
                      <p className="font-semibold text-slate-950">{linkedTicket.subject}</p>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{linkedTicket.description}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">
                      {linkedTicket.ticketNumber} | {toTitleCase(linkedTicket.status)} |{" "}
                      {toTitleCase(linkedTicket.priority)}
                    </p>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                      <Clock3 size={14} className="text-cyan-600" />
                      {linkedTicket.responseEta}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
                {selectedChat.messages?.map((message) => {
                  const isAgent = message.senderType === "agent";

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isAgent ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-full rounded-[1.5rem] px-4 py-4 shadow-sm sm:max-w-2xl sm:px-5 ${
                          isAgent
                            ? "border border-slate-200 bg-slate-50 text-slate-900"
                            : "bg-slate-950 text-white"
                        }`}
                      >
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {message.senderName}
                        </div>
                        <p className="mt-3 text-sm leading-7">{message.text}</p>
                        {message.attachmentUrl && (
                          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
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
                        <p className="mt-3 text-[11px] text-slate-400">
                          {formatDate(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-slate-200 px-4 py-5 sm:px-6">
                <form onSubmit={handleSendReply} className="space-y-4">
                  <textarea
                    rows={4}
                    value={replyDraft}
                    onChange={(event) => setReplyDraft(event.target.value)}
                    placeholder="Reply as the support agent"
                    className="w-full rounded-[1.5rem] border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-400"
                  />

                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 transition hover:border-slate-300 hover:bg-slate-100">
                      Attach File
                      <input
                        type="file"
                        onChange={handleAttachmentChange}
                        accept="image/*,.pdf,.txt,.doc,.docx"
                        className="hidden"
                      />
                    </label>
                    {replyAttachment && (
                      <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
                        <span className="max-w-[220px] truncate font-semibold text-slate-900">
                          {replyAttachment.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setReplyAttachment(null)}
                          className="rounded-full border border-slate-300 px-2 py-1 font-semibold uppercase tracking-[0.1em] text-slate-600 transition hover:border-slate-400"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                  {replyAttachmentError && (
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-600">
                      {replyAttachmentError}
                    </p>
                  )}

                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <label className="inline-flex items-center gap-3 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={closeTicketOnReply}
                        onChange={(event) => setCloseTicketOnReply(event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Close the linked case after sending this reply
                    </label>

                    <button className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                      <SendHorizontal size={18} />
                      Send Agent Reply
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[520px] flex-col items-center justify-center px-4 py-12 text-center md:min-h-[760px] md:px-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Headset size={30} />
              </div>
              <h2 className="mt-6 text-3xl font-black text-slate-950">
                Choose a support chat to begin.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500">
                Pick any active support conversation from the chat queue to review
                messages and reply as an agent.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default SupportDesk;

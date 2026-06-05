"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// ─── Types ──────────────────────────────────────────────────
interface Profile {
  id: string;
  display_name: string;
  avatar_url?: string;
}

interface Room {
  id: string;
  name: string;
  invite_code: string;
}

interface Member {
  user_id: string;
  joined_at: string;
  profiles: Profile;
}

interface SharedItem {
  id: string;
  room_id: string;
  name: string;
  emoji: string;
  status: "in_stock" | "low" | "out_of_stock";
  rotation_order: string[];
  current_turn: number;
  last_buyer_id: string | null;
  last_bought_at: string | null;
  created_at: string;
}

interface Purchase {
  id: string;
  item_id: string;
  room_id: string;
  buyer_id: string;
  price: number;
  note: string;
  bought_at: string;
}

// ─── Constants ──────────────────────────────────────────────
const STATUS_CONFIG = {
  in_stock: { label: "Còn hàng", color: "bg-emerald-500", textColor: "text-emerald-700", bgLight: "bg-emerald-50", borderColor: "border-emerald-200" },
  low: { label: "Sắp hết", color: "bg-amber-500", textColor: "text-amber-700", bgLight: "bg-amber-50", borderColor: "border-amber-300" },
  out_of_stock: { label: "Hết rồi!", color: "bg-rose-500", textColor: "text-rose-700", bgLight: "bg-rose-50", borderColor: "border-rose-300" },
};

const PRODUCT_PRESETS = [
  { name: "Nước mắm", emoji: "🍶", gradient: "from-amber-100 to-orange-100" },
  { name: "Dầu ăn", emoji: "🫒", gradient: "from-yellow-100 to-amber-100" },
  { name: "Nước rửa bát", emoji: "🧴", gradient: "from-sky-100 to-blue-100" },
  { name: "Nước uống", emoji: "💧", gradient: "from-cyan-100 to-teal-100" },
  { name: "Giấy vệ sinh", emoji: "🧻", gradient: "from-pink-100 to-rose-100" },
  { name: "Xà phòng", emoji: "🧼", gradient: "from-violet-100 to-purple-100" },
  { name: "Dầu gội", emoji: "🧴", gradient: "from-indigo-100 to-blue-100" },
  { name: "Bột giặt", emoji: "🫧", gradient: "from-blue-100 to-sky-100" },
  { name: "Gia vị", emoji: "🌶️", gradient: "from-red-100 to-orange-100" },
  { name: "Gạo", emoji: "🍚", gradient: "from-stone-100 to-amber-50" },
];

const AVATAR_COLORS = [
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-sky-500 to-blue-500",
  "from-rose-500 to-pink-500",
  "from-violet-500 to-purple-500",
  "from-cyan-500 to-teal-500",
];

// ─── Helpers ────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "hôm qua";
  if (days < 30) return `${days} ngày trước`;
  return `${Math.floor(days / 30)} tháng trước`;
}

function formatVND(n: number): string {
  return n.toLocaleString("vi-VN") + "đ";
}

function getGradientForEmoji(emoji: string): string {
  const preset = PRODUCT_PRESETS.find((p) => p.emoji === emoji);
  return preset?.gradient || "from-gray-100 to-gray-200";
}

// ─── Component ──────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Tab
  const [activeTab, setActiveTab] = useState<"items" | "history" | "stats">("items");

  // Room
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [roomName, setRoomName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  // Items
  const [items, setItems] = useState<SharedItem[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  // Modals
  const [showAddItem, setShowAddItem] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState<SharedItem | null>(null);
  const [buyPrice, setBuyPrice] = useState("");

  // Edit item states
  const [showEditModal, setShowEditModal] = useState<SharedItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("📦");
  const [editRotationOrder, setEditRotationOrder] = useState<string[]>([]);
  const [editCurrentTurnIdx, setEditCurrentTurnIdx] = useState(0);

  // New item form
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("📦");

  // Messages
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // ─── Auth ───────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      setUser(session.user);

      let { data: prof } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      if (!prof) {
        const { data: created } = await supabase.from("profiles").insert({
          id: session.user.id,
          display_name: session.user.user_metadata?.display_name || session.user.email?.split("@")[0] || "Thành viên",
        }).select().single();
        prof = created;
      }
      setProfile(prof);
      if (prof) await loadRoom(prof.id);
      setLoading(false);
    };
    init();
  }, [router]);

  // ─── Load Room Data ─────────────────────────────────────
  const loadRoom = useCallback(async (userId: string) => {
    const { data: membership } = await supabase
      .from("room_members").select("room_id").eq("user_id", userId).limit(1).single();
    if (!membership) { setRoom(null); return; }

    const { data: roomData } = await supabase
      .from("rooms").select("*").eq("id", membership.room_id).single();
    if (roomData) setRoom(roomData);

    const { data: memberList } = await supabase
      .from("room_members").select("user_id, joined_at, profiles(id, display_name, avatar_url)")
      .eq("room_id", membership.room_id).order("joined_at", { ascending: true });
    setMembers((memberList as any) || []);

    const { data: itemList } = await supabase
      .from("shared_items").select("*").eq("room_id", membership.room_id).order("created_at", { ascending: true });
    setItems((itemList as any) || []);

    const { data: purchaseList } = await supabase
      .from("shared_item_purchases").select("*").eq("room_id", membership.room_id)
      .order("bought_at", { ascending: false }).limit(100);
    setPurchases((purchaseList as any) || []);
  }, []);

  // ─── Room Actions ───────────────────────────────────────
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    setActionError("");
    try {
      const { data: newRoom, error: roomErr } = await supabase
        .from("rooms").insert({ name: roomName, created_by: user.id }).select().single();
      if (roomErr) throw roomErr;
      await supabase.from("room_members").insert({ room_id: newRoom.id, user_id: user.id });
      setActionSuccess("Đã tạo phòng thành công!");
      setRoomName("");
      if (profile) await loadRoom(profile.id);
    } catch (err: any) { setActionError(err.message || "Lỗi tạo phòng."); }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setActionError("");
    try {
      const code = inviteCode.trim();
      const { data: target, error: findErr } = await supabase
        .from("rooms").select("*")
        .or(`invite_code.eq.${code.toUpperCase()},invite_code.eq.${code.toLowerCase()}`)
        .single();
      if (findErr || !target) { setActionError("Mã mời không chính xác!"); return; }
      const { error: joinErr } = await supabase.from("room_members").insert({ room_id: target.id, user_id: user.id });
      if (joinErr) {
        if (joinErr.code === "23505") { setActionError("Bạn đã ở trong phòng này rồi!"); }
        else { setActionError(joinErr.message); }
        return;
      }
      setActionSuccess(`Đã tham gia phòng ${target.name}!`);
      setInviteCode("");
      if (profile) await loadRoom(profile.id);
    } catch (err: any) { setActionError(err.message); }
  };

  // ─── Item Actions ───────────────────────────────────────
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !room) return;
    setActionError("");
    try {
      const rotationOrder = members.map((m) => m.user_id);
      const { error } = await supabase.from("shared_items").insert({
        room_id: room.id,
        name: newName.trim(),
        emoji: newEmoji,
        rotation_order: rotationOrder,
        current_turn: 0,
      });
      if (error) throw error;
      setActionSuccess(`Đã thêm "${newName}" vào danh sách!`);
      setNewName("");
      setNewEmoji("📦");
      setShowAddItem(false);
      if (profile) await loadRoom(profile.id);
    } catch (err: any) { setActionError(err.message); }
  };

  const handleUpdateStatus = async (item: SharedItem, newStatus: "in_stock" | "low" | "out_of_stock") => {
    try {
      await supabase.from("shared_items").update({ status: newStatus }).eq("id", item.id);
      if (profile) await loadRoom(profile.id);
    } catch (err: any) { setActionError(err.message); }
  };

  const handleConfirmBuy = async () => {
    if (!showBuyModal || !user || !room) return;
    const item = showBuyModal;
    try {
      // Record purchase
      await supabase.from("shared_item_purchases").insert({
        item_id: item.id,
        room_id: room.id,
        buyer_id: user.id,
        price: buyPrice ? Number(buyPrice) : 0,
      });
      // Rotate turn
      const nextTurn = (item.current_turn + 1) % (item.rotation_order.length || 1);
      await supabase.from("shared_items").update({
        status: "in_stock",
        last_buyer_id: user.id,
        last_bought_at: new Date().toISOString(),
        current_turn: nextTurn,
      }).eq("id", item.id);

      setActionSuccess(`Đã ghi nhận bạn mua "${item.name}"! Lượt tiếp đã xoay.`);
      setShowBuyModal(null);
      setBuyPrice("");
      if (profile) await loadRoom(profile.id);
    } catch (err: any) { setActionError(err.message); }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Bạn có chắc muốn xoá sản phẩm này?")) return;
    try {
      await supabase.from("shared_items").delete().eq("id", itemId);
      if (profile) await loadRoom(profile.id);
    } catch (err: any) { setActionError(err.message); }
  };

  const handleOpenEditModal = (item: SharedItem) => {
    setShowEditModal(item);
    setEditName(item.name);
    setEditEmoji(item.emoji);
    setEditRotationOrder(item.rotation_order || []);
    setEditCurrentTurnIdx(item.current_turn);
  };

  const handleToggleMember = (userId: string) => {
    const activeBuyerId = editRotationOrder[editCurrentTurnIdx];
    let newOrder = [...editRotationOrder];
    if (newOrder.includes(userId)) {
      newOrder = newOrder.filter((id) => id !== userId);
    } else {
      newOrder.push(userId);
    }
    setEditRotationOrder(newOrder);

    if (newOrder.length === 0) {
      setEditCurrentTurnIdx(0);
    } else {
      const nextIdx = newOrder.indexOf(activeBuyerId);
      setEditCurrentTurnIdx(nextIdx !== -1 ? nextIdx : 0);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const activeBuyerId = editRotationOrder[editCurrentTurnIdx];
    const newOrder = [...editRotationOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = temp;
    setEditRotationOrder(newOrder);

    const nextIdx = newOrder.indexOf(activeBuyerId);
    setEditCurrentTurnIdx(nextIdx !== -1 ? nextIdx : 0);
  };

  const handleMoveDown = (index: number) => {
    if (index === editRotationOrder.length - 1) return;
    const activeBuyerId = editRotationOrder[editCurrentTurnIdx];
    const newOrder = [...editRotationOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;
    setEditRotationOrder(newOrder);

    const nextIdx = newOrder.indexOf(activeBuyerId);
    setEditCurrentTurnIdx(nextIdx !== -1 ? nextIdx : 0);
  };

  const handleSetNextTurn = (userId: string) => {
    const idx = editRotationOrder.indexOf(userId);
    if (idx !== -1) {
      setEditCurrentTurnIdx(idx);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    try {
      setActionError("");
      const { error } = await supabase.from("shared_items").update({
        name: editName.trim(),
        emoji: editEmoji,
        rotation_order: editRotationOrder,
        current_turn: editCurrentTurnIdx,
      }).eq("id", showEditModal.id);

      if (error) throw error;
      setActionSuccess(`Đã cập nhật sản phẩm "${editName}"!`);
      setShowEditModal(null);
      if (profile) await loadRoom(profile.id);
    } catch (err: any) {
      setActionError(err.message || "Lỗi cập nhật sản phẩm.");
    }
  };

  // ─── Helpers ────────────────────────────────────────────
  const getMemberName = (id: string) => members.find((m) => m.user_id === id)?.profiles.display_name || "???";
  const getMemberIdx = (id: string) => members.findIndex((m) => m.user_id === id);
  const getAvatarColor = (id: string) => AVATAR_COLORS[getMemberIdx(id) % AVATAR_COLORS.length];

  const getNextBuyerId = (item: SharedItem) => {
    if (!item.rotation_order || item.rotation_order.length === 0) return null;
    return item.rotation_order[item.current_turn % item.rotation_order.length];
  };

  const isMyTurn = (item: SharedItem) => getNextBuyerId(item) === user?.id;

  // Stats
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthPurchases = purchases.filter((p) => p.bought_at.startsWith(currentMonth));
  const spendingByUser: { [userId: string]: number } = {};
  monthPurchases.forEach((p) => { spendingByUser[p.buyer_id] = (spendingByUser[p.buyer_id] || 0) + (p.price || 0); });
  const totalMonthSpend = Object.values(spendingByUser).reduce((a, b) => a + b, 0);
  const maxSpend = Math.max(...Object.values(spendingByUser), 1);

  const myTurnItems = items.filter((item) => isMyTurn(item) && item.status !== "in_stock");
  const urgentItems = items.filter((item) => item.status === "out_of_stock");

  // ─── Logout ─────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // ─── Loading ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
          <p className="text-sm text-gray-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  // ─── No Room ────────────────────────────────────────────
  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/90 backdrop-blur-lg">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold text-sm">T</span>
              <span className="font-bold text-gray-900">Tro<span className="text-emerald-600">Mate</span></span>
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">{profile?.display_name}</span>
              <button onClick={handleLogout} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">Đăng xuất</button>
            </div>
          </div>
        </header>

        {/* Messages */}
        {actionError && (
          <div className="mx-auto max-w-5xl px-5 pt-4">
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-800 flex justify-between items-center">
              {actionError}
              <button onClick={() => setActionError("")} className="text-rose-400 hover:text-rose-600 text-lg">×</button>
            </div>
          </div>
        )}
        {actionSuccess && (
          <div className="mx-auto max-w-5xl px-5 pt-4">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 flex justify-between items-center">
              {actionSuccess}
              <button onClick={() => setActionSuccess("")} className="text-emerald-400 hover:text-emerald-600 text-lg">×</button>
            </div>
          </div>
        )}

        {/* Join/Create */}
        <div className="mx-auto max-w-2xl px-5 py-16">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold text-gray-900">Chào mừng bạn đến với TroMate!</h1>
            <p className="mt-2 text-gray-500">Bạn chưa tham gia phòng trọ nào. Hãy tạo phòng mới hoặc gia nhập cùng các bạn của mình.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">🏠 Tạo phòng mới</h3>
              <form onSubmit={handleCreateRoom} className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên phòng trọ</label>
                  <input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="Ví dụ: Phòng 302, Trọ Hoa Mai" className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
                </div>
                <button type="submit" className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">Tạo phòng</button>
              </form>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">🔑 Tham gia phòng trọ</h3>
              <form onSubmit={handleJoinRoom} className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã mời (6 chữ số)</label>
                  <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="Ví dụ: 54CE38" className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-mono uppercase focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
                </div>
                <button type="submit" className="w-full rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors">Tham gia</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Dashboard ─────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold text-sm">T</span>
            <span className="font-bold text-gray-900">Tro<span className="text-emerald-600">Mate</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">{profile?.display_name}</span>
            <button onClick={handleLogout} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">Đăng xuất</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-6">
        {/* Messages */}
        {actionError && (
          <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-800 flex justify-between items-center">
            {actionError}
            <button onClick={() => setActionError("")} className="text-rose-400 hover:text-rose-600 text-lg">×</button>
          </div>
        )}
        {actionSuccess && (
          <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 flex justify-between items-center">
            {actionSuccess}
            <button onClick={() => setActionSuccess("")} className="text-emerald-400 hover:text-emerald-600 text-lg">×</button>
          </div>
        )}

        {/* Room Info */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Phòng đang quản lý</p>
              <h2 className="mt-0.5 text-xl font-extrabold text-gray-900">{room.name}</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-2 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Mã mời</p>
                <p className="text-base font-mono font-bold text-gray-800 tracking-widest uppercase">{room.invite_code}</p>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(room.invite_code); setActionSuccess("Đã copy mã mời!"); }} className="rounded-xl bg-gray-100 p-2.5 hover:bg-gray-200 transition-colors" title="Copy mã mời">
                📋
              </button>
            </div>
          </div>
          {/* Members */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-400">👥 Thành viên ({members.length}):</span>
            {members.map((m, i) => (
              <span key={m.user_id} className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${AVATAR_COLORS[i % AVATAR_COLORS.length]} px-3 py-1 text-xs font-semibold text-white shadow-sm`}>
                {m.profiles.display_name.charAt(0).toUpperCase()}
                <span className="text-white/90">{m.profiles.display_name}</span>
              </span>
            ))}
          </div>
        </div>

        {/* My Turn Alert */}
        {myTurnItems.length > 0 && (
          <div className="mb-6 rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-3xl animate-bounce">⚡</span>
              <div>
                <p className="font-bold text-amber-900">Đến lượt bạn mua!</p>
                <p className="text-sm text-amber-700">
                  {myTurnItems.map((it) => `${it.emoji} ${it.name}`).join(", ")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl bg-gray-100 p-1">
          {([
            { key: "items" as const, label: "🛒 Đồ dùng chung", count: items.length },
            { key: "history" as const, label: "📜 Lịch sử", count: purchases.length },
            { key: "stats" as const, label: "📊 Thống kê tháng", count: null },
          ]).map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${activeTab === tab.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {tab.label}
              {tab.count !== null && <span className="ml-1.5 text-xs text-gray-400">({tab.count})</span>}
            </button>
          ))}
        </div>

        {/* ══════════ TAB 1: ITEMS ══════════ */}
        {activeTab === "items" && (
          <div>
            {/* Urgent banner */}
            {urgentItems.length > 0 && (
              <div className="mb-5 rounded-xl bg-rose-50 border border-rose-200 p-4">
                <p className="text-sm font-bold text-rose-800">🚨 {urgentItems.length} sản phẩm đã hết — cần mua gấp!</p>
              </div>
            )}

            {/* Item Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => {
                const nextBuyer = getNextBuyerId(item);
                const nextBuyerName = nextBuyer ? getMemberName(nextBuyer) : "—";
                const cfg = STATUS_CONFIG[item.status];
                const isUrgent = item.status === "out_of_stock";
                const isLow = item.status === "low";
                const myItem = nextBuyer === user?.id;

                return (
                  <div key={item.id} className={`group relative rounded-2xl border-2 bg-white p-5 shadow-sm transition-all hover:shadow-lg ${isUrgent ? "border-rose-300 animate-pulse" : isLow ? "border-amber-200" : "border-gray-200 hover:border-emerald-200"}`}>
                    {/* Actions */}
                    <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenEditModal(item)} className="text-gray-400 hover:text-emerald-600 text-sm" title="Sửa sản phẩm">✏️</button>
                      <button onClick={() => handleDeleteItem(item.id)} className="text-gray-400 hover:text-rose-500 text-sm" title="Xoá sản phẩm">✕</button>
                    </div>

                    {/* Product Icon */}
                    <div className="flex items-start gap-4">
                      <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${getGradientForEmoji(item.emoji)} text-3xl shadow-sm flex-shrink-0`}>
                        {item.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">{item.name}</h3>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className={`inline-block h-2 w-2 rounded-full ${cfg.color}`} />
                          <span className={`text-xs font-semibold ${cfg.textColor}`}>{cfg.label}</span>
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="mt-4 space-y-2">
                      {item.last_buyer_id && (
                        <p className="text-xs text-gray-400">
                          Mua gần nhất: <span className="font-medium text-gray-600">{getMemberName(item.last_buyer_id)}</span>
                          {item.last_bought_at && ` — ${timeAgo(item.last_bought_at)}`}
                        </p>
                      )}
                      <div className={`rounded-lg ${myItem && item.status !== "in_stock" ? "bg-amber-50 border border-amber-200" : "bg-gray-50"} px-3 py-2`}>
                        <p className="text-xs text-gray-500">
                          ➡️ Lượt tiếp: <span className={`font-bold ${myItem ? "text-amber-700" : "text-gray-800"}`}>{nextBuyerName}</span>
                          {myItem && item.status !== "in_stock" && <span className="ml-1 text-amber-600 font-bold">(BẠN!)</span>}
                        </p>
                      </div>
                    </div>

                    {/* Rotation visual */}
                    <div className="mt-3 flex items-center gap-1 overflow-x-auto pb-1">
                      {item.rotation_order.map((uid, idx) => {
                        const isCurrent = idx === item.current_turn % item.rotation_order.length;
                        return (
                          <React.Fragment key={uid}>
                            {idx > 0 && <span className="text-[10px] text-gray-300 flex-shrink-0">→</span>}
                            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold flex-shrink-0 transition-all ${isCurrent ? `bg-gradient-to-br ${getAvatarColor(uid)} text-white shadow-md ring-2 ring-offset-1 ring-emerald-300` : "bg-gray-100 text-gray-400"}`}>
                              {getMemberName(uid).charAt(0).toUpperCase()}
                            </span>
                          </React.Fragment>
                        );
                      })}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex gap-2">
                      {item.status === "in_stock" && (
                        <>
                          <button onClick={() => handleUpdateStatus(item, "low")} className="flex-1 rounded-lg bg-amber-50 border border-amber-200 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors">
                            ⚠️ Sắp hết
                          </button>
                          <button onClick={() => handleUpdateStatus(item, "out_of_stock")} className="flex-1 rounded-lg bg-rose-50 border border-rose-200 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors">
                            🚨 Đã hết
                          </button>
                        </>
                      )}
                      {(item.status === "low" || item.status === "out_of_stock") && (
                        <>
                          <button onClick={() => { setShowBuyModal(item); setBuyPrice(""); }} className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm">
                            ✅ Tôi đã mua
                          </button>
                          {item.status === "low" && (
                            <button onClick={() => handleUpdateStatus(item, "in_stock")} className="rounded-lg bg-gray-100 border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-200 transition-colors">
                              Còn mà
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add New Item Card */}
              <button onClick={() => setShowAddItem(true)} className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-white p-8 text-gray-400 transition-all hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/30 min-h-[200px]">
                <span className="text-4xl">＋</span>
                <span className="text-sm font-semibold">Thêm đồ dùng mới</span>
              </button>
            </div>
          </div>
        )}

        {/* ══════════ TAB 2: HISTORY ══════════ */}
        {activeTab === "history" && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-5">📜 Lịch sử mua sắm</h3>
            {purchases.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">🛒</p>
                <p className="text-gray-400">Chưa có ai mua gì cả. Hãy bắt đầu!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {purchases.map((p) => {
                  const item = items.find((it) => it.id === p.item_id);
                  return (
                    <div key={p.id} className="flex items-center gap-4 rounded-xl bg-gray-50 px-4 py-3 hover:bg-gray-100 transition-colors">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${getGradientForEmoji(item?.emoji || "📦")} text-lg flex-shrink-0`}>
                        {item?.emoji || "📦"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarColor(p.buyer_id)} text-[9px] font-bold text-white mr-1.5`}>
                            {getMemberName(p.buyer_id).charAt(0).toUpperCase()}
                          </span>
                          {getMemberName(p.buyer_id)} mua {item?.name || "Sản phẩm"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{timeAgo(p.bought_at)}</p>
                      </div>
                      {p.price > 0 && (
                        <span className="text-sm font-bold text-emerald-600 flex-shrink-0">{formatVND(p.price)}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════ TAB 3: STATS ══════════ */}
        {activeTab === "stats" && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-1">📊 Thống kê tháng {new Date().toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}</h3>
            <p className="text-sm text-gray-400 mb-6">Tổng chi tiêu mua đồ chung của mỗi thành viên</p>

            {totalMonthSpend === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">📊</p>
                <p className="text-gray-400">Chưa có dữ liệu thống kê tháng này.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {members.map((m, i) => {
                  const spent = spendingByUser[m.user_id] || 0;
                  const pct = maxSpend > 0 ? (spent / maxSpend) * 100 : 0;
                  return (
                    <div key={m.user_id} className="flex items-center gap-4">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} text-sm font-bold text-white flex-shrink-0`}>
                        {m.profiles.display_name.charAt(0).toUpperCase()}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-gray-800">{m.profiles.display_name}</span>
                          <span className="text-sm font-bold text-gray-900">{formatVND(spent)}</span>
                        </div>
                        <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                          <div className={`h-full rounded-full bg-gradient-to-r ${AVATAR_COLORS[i % AVATAR_COLORS.length]} transition-all duration-700`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-500">Tổng cộng</span>
                  <span className="text-lg font-extrabold text-emerald-600">{formatVND(totalMonthSpend)}</span>
                </div>
                {members.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Trung bình / người</span>
                    <span className="text-sm font-semibold text-gray-600">{formatVND(Math.round(totalMonthSpend / members.length))}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════ MODALS ══════════ */}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-5" onClick={() => setShowAddItem(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-5">➕ Thêm đồ dùng mới</h3>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên sản phẩm</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ví dụ: Nước mắm Nam Ngư" className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Chọn biểu tượng</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PRODUCT_PRESETS.map((p) => (
                    <button key={p.emoji + p.name} type="button" onClick={() => { setNewEmoji(p.emoji); if (!newName) setNewName(p.name); }}
                      className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all ${newEmoji === p.emoji ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <span className="text-2xl">{p.emoji}</span>
                      <span className="text-[10px] text-gray-500">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddItem(false)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">Huỷ</button>
                <button type="submit" className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">Thêm sản phẩm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Buy Confirm Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-5" onClick={() => setShowBuyModal(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${getGradientForEmoji(showBuyModal.emoji)} text-4xl shadow-md mb-3`}>
                {showBuyModal.emoji}
              </div>
              <h3 className="text-lg font-bold text-gray-900">Bạn đã mua {showBuyModal.name}?</h3>
              <p className="text-sm text-gray-500 mt-1">Xác nhận để ghi nhận lượt mua và xoay vòng</p>
            </div>
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Giá tiền (tuỳ chọn)</label>
              <input value={buyPrice} onChange={(e) => setBuyPrice(e.target.value.replace(/\D/g, ""))} placeholder="Ví dụ: 25000" className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
              {buyPrice && <p className="mt-1 text-xs text-gray-400">= {formatVND(Number(buyPrice))}</p>}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowBuyModal(null)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">Huỷ</button>
              <button onClick={handleConfirmBuy} className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 shadow-sm">✅ Xác nhận đã mua</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && (() => {
        const activeMemberIds = editRotationOrder;
        const inactiveMembers = members.filter((m) => !activeMemberIds.includes(m.user_id));
        const sortedEditMembers = [
          ...activeMemberIds.map((uid) => members.find((m) => m.user_id === uid)).filter(Boolean) as Member[],
          ...inactiveMembers,
        ];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-5" onClick={() => setShowEditModal(null)}>
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  ⚙️ Chỉnh sửa sản phẩm
                </h3>
                <button onClick={() => setShowEditModal(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên sản phẩm</label>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Ví dụ: Nước mắm Nam Ngư" className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none" required />
                </div>

                {/* Emoji */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Chọn biểu tượng</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {PRODUCT_PRESETS.map((p) => (
                      <button key={p.emoji + p.name} type="button" onClick={() => { setEditEmoji(p.emoji); if (!editName) setEditName(p.name); }}
                        className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2.5 transition-all ${editEmoji === p.emoji ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300"}`}>
                        <span className="text-2xl">{p.emoji}</span>
                        <span className="text-[9px] text-gray-500">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rotation Order */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Vòng xoay lượt mua</label>
                  <p className="text-xs text-gray-400 mb-3">Tích chọn thành viên tham gia, bấm mũi tên để sắp xếp thứ tự đi mua, chọn 🎯 để đặt làm người đi mua lượt kế tiếp.</p>
                  
                  <div className="rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100 max-h-60 overflow-y-auto">
                    {sortedEditMembers.map((member) => {
                      const uid = member.user_id;
                      const name = member.profiles.display_name;
                      const isActive = editRotationOrder.includes(uid);
                      const idxInRotation = editRotationOrder.indexOf(uid);
                      const isCurrentTurn = isActive && idxInRotation === editCurrentTurnIdx;
                      
                      return (
                        <div key={uid} className={`flex items-center justify-between p-3 transition-colors ${isActive ? "bg-white" : "bg-gray-50/50"}`}>
                          {/* Left: Checkbox + Name */}
                          <div className="flex items-center gap-2.5">
                            <input type="checkbox" id={`checkbox-${uid}`} checked={isActive} onChange={() => handleToggleMember(uid)} className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white bg-gradient-to-br ${getAvatarColor(uid)}`}>
                              {name.charAt(0).toUpperCase()}
                            </span>
                            <label htmlFor={`checkbox-${uid}`} className={`text-sm cursor-pointer select-none ${isActive ? "font-semibold text-gray-800" : "text-gray-400"}`}>
                              {name}
                            </label>
                          </div>

                          {/* Right: Actions */}
                          {isActive && (
                            <div className="flex items-center gap-2">
                              {/* Turn Target Button */}
                              <button type="button" onClick={() => handleSetNextTurn(uid)} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold transition-all border ${isCurrentTurn ? "bg-emerald-600 border-emerald-600 text-white shadow-sm" : "bg-white border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600"}`} title={isCurrentTurn ? "Đang đến lượt" : "Đặt làm người mua tiếp theo"}>
                                <span>🎯</span>
                                <span>{isCurrentTurn ? "Đang đến lượt" : "Lượt tiếp"}</span>
                              </button>

                              {/* Reorder Arrows */}
                              <div className="flex items-center gap-0.5">
                                <button type="button" onClick={() => handleMoveUp(idxInRotation)} disabled={idxInRotation === 0} className={`p-1 rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none`} title="Di chuyển lên">
                                  ▲
                                </button>
                                <button type="button" onClick={() => handleMoveDown(idxInRotation)} disabled={idxInRotation === editRotationOrder.length - 1} className={`p-1 rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none`} title="Di chuyển xuống">
                                  ▼
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {editRotationOrder.length === 0 && (
                    <p className="mt-2 text-xs font-semibold text-rose-500">⚠️ Vòng xoay phải có ít nhất 1 thành viên tham gia!</p>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-3 border-t border-gray-100">
                  <button type="button" onClick={() => setShowEditModal(null)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                    Huỷ
                  </button>
                  <button type="submit" disabled={editRotationOrder.length === 0} className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm transition-all">
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

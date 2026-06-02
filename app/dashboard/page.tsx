"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Profile {
  id: string;
  display_name: string;
  avatar_url?: string;
  bank_id?: string;
  bank_account?: string;
  bank_owner_name?: string;
}

interface Room {
  id: string;
  name: string;
  invite_code: string;
}

interface Member {
  user_id: string;
  profiles: Profile;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  paid_by: string;
  created_at: string;
  category?: string;
  profiles: Profile;
}

interface RoomBill {
  id: string;
  bill_month: string;
  rent_amount: number;
  electricity_amount: number;
  water_amount: number;
  internet_amount: number;
  services_amount: number;
  total_amount: number;
  image_url?: string;
  paid_by: string;
  created_at: string;
  profiles: Profile;
}

interface PersonalExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  created_at: string;
}

interface CatalogItem {
  id: string;
  room_id: string | null;
  name: string;
  default_price: number;
  emoji: string;
}

interface FundTransaction {
  id: string;
  amount: number;
  description: string;
  created_at: string;
  profiles: { display_name: string };
}

interface DebtSettlement {
  id: string;
  debtor_id: string;
  creditor_id: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

interface Debt {
  from: string;
  to: string;
  amount: number;
  fromId: string;
  toId: string;
}

const BANK_LIST = [
  { id: "mbbank", name: "MBBank (Quân Đội)" },
  { id: "vietcombank", name: "Vietcombank" },
  { id: "techcombank", name: "Techcombank" },
  { id: "bidv", name: "BIDV" },
  { id: "agribank", name: "Agribank" },
  { id: "acb", name: "ACB" },
  { id: "vietinbank", name: "VietinBank" },
  { id: "tpb", name: "TPBank" },
  { id: "vpb", name: "VPBank" },
  { id: "shb", name: "SHB" },
];

const CATEGORY_COLORS: { [key: string]: string } = {
  "Tiền nhà": "bg-indigo-500",
  "Tiền điện": "bg-amber-500",
  "Tiền nước": "bg-sky-500",
  "Ăn uống": "bg-emerald-500",
  "Sinh hoạt": "bg-rose-500",
  "Mạng Internet": "bg-purple-500",
  "Dịch vụ khác": "bg-teal-500",
  "Khác": "bg-gray-400",
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Tabs navigation
  const [activeTab, setActiveTab] = useState<"room-expenses" | "monthly-bills" | "personal-expenses">("room-expenses");

  // Room states
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [roomBills, setRoomBills] = useState<RoomBill[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);

  // Room Fund States
  const [fundTransactions, setFundTransactions] = useState<FundTransaction[]>([]);
  const [fundBalance, setFundBalance] = useState(0);
  const [fundAmount, setFundAmount] = useState("");
  const [fundDesc, setFundDesc] = useState("Đóng tiền quỹ phòng");
  const [isFundPayment, setIsFundPayment] = useState(false);

  // Settlement States
  const [settlements, setSettlements] = useState<DebtSettlement[]>([]);
  const [activePayDebt, setActivePayDebt] = useState<{ creditorId: string; creditorName: string; amount: number } | null>(null);

  // Personal expenses states
  const [personalExpenses, setPersonalExpenses] = useState<PersonalExpense[]>([]);
  const [personalBudget, setPersonalBudget] = useState(2000000);

  // Form states - Expenses
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Ăn uống");

  // Form states - Catalog Add Item
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemEmoji, setNewItemEmoji] = useState("📦");
  const [showCatalogModal, setShowCatalogModal] = useState(false);

  // Form states - Bank Settings
  const [bankId, setBankId] = useState("mbbank");
  const [bankAccount, setBankAccount] = useState("");
  const [bankOwnerName, setBankOwnerName] = useState("");
  const [showBankModal, setShowBankModal] = useState(false);

  // Form states - Monthly Bills
  const [billMonth, setBillMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [rentAmount, setRentAmount] = useState("3500000");
  
  // Electric input details
  const [elecOld, setElecOld] = useState("6136");
  const [elecNew, setElecNew] = useState("6286");
  const [elecRate, setElecRate] = useState("2500");
  
  // Water input details
  const [waterRate, setWaterRate] = useState("100000");
  
  // Other service inputs
  const [internetAmount, setInternetAmount] = useState("100000");
  const [otherServicesAmount, setOtherServicesAmount] = useState("525000");
  
  const [billPayer, setBillPayer] = useState("");
  const [billFile, setBillFile] = useState<File | null>(null);
  const [billUploading, setBillUploading] = useState(false);
  const [selectedBillPhoto, setSelectedBillPhoto] = useState<string | null>(null);

  // Form states - Personal Expenses
  const [personalDesc, setPersonalDesc] = useState("");
  const [personalAmount, setPersonalAmount] = useState("");
  const [personalCategory, setPersonalCategory] = useState("Ăn uống");

  // Room Create/Join
  const [roomName, setRoomName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  // Dynamic calculations
  const [debts, setDebts] = useState<Debt[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);

  // Alert notices
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // 1. Initial Auth Check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);
      setBillPayer(session.user.id);

      // Get profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      
      setProfile(profileData);

      // Load personal budget from localStorage
      if (typeof window !== "undefined") {
        const savedBudget = localStorage.getItem("personal_budget");
        if (savedBudget) {
          setProfile((prev: any) => {
            if (prev) return { ...prev };
            return prev;
          });
          setPersonalBudget(Number(savedBudget));
        }
      }

      if (profileData) {
        setBankId(profileData.bank_id || "mbbank");
        setBankAccount(profileData.bank_account || "");
        setBankOwnerName(profileData.bank_owner_name || "");
        
        await loadRoomData(profileData.id);
        await loadPersonalExpenses(profileData.id);
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  // 2. Load Room Data from Supabase
  const loadRoomData = async (userId: string) => {
    const { data: memberOf } = await supabase
      .from("room_members")
      .select("room_id")
      .eq("user_id", userId)
      .single();

    if (memberOf) {
      // Get room info
      const { data: roomData } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", memberOf.room_id)
        .single();

      if (roomData) {
        setRoom(roomData);

        // Get members
        const { data: memberList } = await supabase
          .from("room_members")
          .select("user_id, profiles(id, display_name, avatar_url, bank_id, bank_account, bank_owner_name)")
          .eq("room_id", roomData.id);
        const membersTyped = (memberList as any) || [];
        setMembers(membersTyped);

        // Get standard expenses
        const { data: expenseList } = await supabase
          .from("expenses")
          .select("id, description, amount, paid_by, created_at, category, profiles(id, display_name)")
          .eq("room_id", roomData.id)
          .order("created_at", { ascending: false });
        const expensesTyped = (expenseList as any) || [];
        setExpenses(expensesTyped);

        // Get monthly bills
        const { data: billList } = await supabase
          .from("room_bills")
          .select("id, bill_month, rent_amount, electricity_amount, water_amount, internet_amount, services_amount, total_amount, image_url, paid_by, created_at, profiles(id, display_name)")
          .eq("room_id", roomData.id)
          .order("bill_month", { ascending: false });
        const billsTyped = (billList as any) || [];
        setRoomBills(billsTyped);

        // Get Catalog items
        const { data: catalogList } = await supabase
          .from("room_catalog_items")
          .select("*")
          .or(`room_id.is.null,room_id.eq.${roomData.id}`)
          .order("created_at", { ascending: true });
        setCatalogItems(catalogList || []);

        // Get Fund transactions
        const { data: fundList } = await supabase
          .from("room_fund_transactions")
          .select("id, amount, description, created_at, profiles(display_name)")
          .eq("room_id", roomData.id)
          .order("created_at", { ascending: false });
        const fundTyped = (fundList as any) || [];
        setFundTransactions(fundTyped);
        
        const balanceSum = fundTyped.reduce((sum: number, tx: FundTransaction) => sum + Number(tx.amount), 0);
        setFundBalance(balanceSum);

        // Get Debt Settlements
        const { data: settlementList } = await supabase
          .from("debt_settlements")
          .select("*")
          .eq("room_id", roomData.id)
          .order("created_at", { ascending: false });
        const settlementsTyped = (settlementList as any) || [];
        setSettlements(settlementsTyped);

        // Calculate combined balances
        calculateCombinedDebts(expensesTyped, billsTyped, settlementsTyped, membersTyped);
      }
    } else {
      setRoom(null);
      setMembers([]);
      setExpenses([]);
      setRoomBills([]);
      setCatalogItems([]);
      setFundTransactions([]);
      setFundBalance(0);
      setSettlements([]);
      setDebts([]);
    }
  };

  // Load Private Personal Expenses
  const loadPersonalExpenses = async (userId: string) => {
    const { data } = await supabase
      .from("personal_expenses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setPersonalExpenses(data || []);
  };

  // Debt simplification considering expenses, monthly bills, and approved settlements
  const calculateCombinedDebts = (
    curExpenses: Expense[],
    curBills: RoomBill[],
    curSettlements: DebtSettlement[],
    curMembers: Member[]
  ) => {
    if (curMembers.length === 0) return;

    const balances: { [key: string]: number } = {};
    const names: { [key: string]: string } = {};

    curMembers.forEach((m) => {
      balances[m.user_id] = 0;
      names[m.user_id] = m.profiles.display_name;
    });

    let total = 0;
    const numMembers = curMembers.length;

    // 1. Process regular shared expenses
    curExpenses.forEach((exp) => {
      const amount = Number(exp.amount);
      total += amount;
      const payer = exp.paid_by;
      const share = amount / numMembers;

      curMembers.forEach((m) => {
        if (m.user_id === payer) {
          balances[payer] += amount - share;
        } else {
          balances[m.user_id] -= share;
        }
      });
    });

    // 2. Process room monthly bills
    curBills.forEach((bill) => {
      const amount = Number(bill.total_amount);
      total += amount;
      const payer = bill.paid_by;
      const share = amount / numMembers;

      curMembers.forEach((m) => {
        if (m.user_id === payer) {
          balances[payer] += amount - share;
        } else {
          balances[m.user_id] -= share;
        }
      });
    });

    // 3. Process approved settlements (paying off debts)
    // If A paid B 50k and it is approved:
    // A's net balance increases by 50k (paid off debt)
    // B's net balance decreases by 50k (received money)
    curSettlements.forEach((set) => {
      if (set.status === "approved") {
        const amount = Number(set.amount);
        if (balances[set.debtor_id] !== undefined) {
          balances[set.debtor_id] += amount;
        }
        if (balances[set.creditor_id] !== undefined) {
          balances[set.creditor_id] -= amount;
        }
      }
    });

    setTotalSpent(total);

    // Match creditors and debtors
    const creditors: { id: string; amount: number }[] = [];
    const debtors: { id: string; amount: number }[] = [];

    Object.keys(balances).forEach((id) => {
      if (balances[id] > 0.5) {
        creditors.push({ id, amount: balances[id] });
      } else if (balances[id] < -0.5) {
        debtors.push({ id, amount: Math.abs(balances[id]) });
      }
    });

    const calculatedDebts: Debt[] = [];
    let cIdx = 0;
    let dIdx = 0;

    while (cIdx < creditors.length && dIdx < debtors.length) {
      const creditor = creditors[cIdx];
      const debtor = debtors[dIdx];

      const amountToPay = Math.min(creditor.amount, debtor.amount);
      if (amountToPay > 1) {
        calculatedDebts.push({
          from: names[debtor.id] || "Ẩn danh",
          to: names[creditor.id] || "Ẩn danh",
          amount: Math.round(amountToPay),
          fromId: debtor.id,
          toId: creditor.id,
        });
      }

      creditor.amount -= amountToPay;
      debtor.amount -= amountToPay;

      if (creditor.amount < 0.5) cIdx++;
      if (debtor.amount < 0.5) dIdx++;
    }

    setDebts(calculatedDebts);
  };

  // Actions: Room Manage
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    setActionError("");

    try {
      const { data: newRoom, error: roomErr } = await supabase
        .from("rooms")
        .insert({ name: roomName, created_by: user.id })
        .select()
        .single();

      if (roomErr) throw roomErr;

      const { error: memErr } = await supabase
        .from("room_members")
        .insert({ room_id: newRoom.id, user_id: user.id });

      if (memErr) throw memErr;

      setActionSuccess("Đã tạo phòng thành công!");
      setRoomName("");
      if (profile) await loadRoomData(profile.id);
    } catch (err: any) {
      setActionError(err.message || "Lỗi tạo phòng.");
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setActionError("");

    try {
      const { data: targetRoom, error: findErr } = await supabase
        .from("rooms")
        .select("*")
        .eq("invite_code", inviteCode.trim().toUpperCase())
        .single();

      if (findErr || !targetRoom) {
        setActionError("Mã mời không chính xác hoặc phòng không tồn tại!");
        return;
      }

      const { error: joinErr } = await supabase
        .from("room_members")
        .insert({ room_id: targetRoom.id, user_id: user.id });

      if (joinErr) {
        if (joinErr.code === "23505") {
          setActionError("Bạn đã ở trong phòng này rồi!");
        } else {
          throw joinErr;
        }
        return;
      }

      setActionSuccess(`Đã tham gia vào phòng ${targetRoom.name}!`);
      setInviteCode("");
      if (profile) await loadRoomData(profile.id);
    } catch (err: any) {
      setActionError(err.message || "Lỗi tham gia phòng.");
    }
  };

  // Save Bank Settings
  const handleSaveBankSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankAccount.trim() || !bankOwnerName.trim()) return;
    setActionError("");

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          bank_id: bankId,
          bank_account: bankAccount.trim(),
          bank_owner_name: bankOwnerName.trim().toUpperCase(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setActionSuccess("Đã lưu cài đặt tài khoản ngân hàng!");
      setShowBankModal(false);
      
      // Update local profile state
      if (profile) {
        setProfile({
          ...profile,
          bank_id: bankId,
          bank_account: bankAccount,
          bank_owner_name: bankOwnerName.toUpperCase(),
        });
      }
      if (profile) await loadRoomData(profile.id);
    } catch (err: any) {
      setActionError(err.message || "Lỗi lưu tài khoản nhận tiền.");
    }
  };

  // Add Expense (handles standard vs room fund purchases)
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc.trim() || !expenseAmount || !room) return;
    setActionError("");

    const amountNum = Number(expenseAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setActionError("Số tiền phải lớn hơn 0!");
      return;
    }

    try {
      if (isFundPayment) {
        // 1. Paid via Room Fund
        if (fundBalance < amountNum) {
          setActionError(`Quỹ phòng không đủ tiền! Số dư hiện tại là ${fundBalance.toLocaleString("vi-VN")}đ`);
          return;
        }

        // Insert into fund transactions (negative amount)
        const { error: fundErr } = await supabase
          .from("room_fund_transactions")
          .insert({
            room_id: room.id,
            user_id: user.id,
            amount: -amountNum,
            description: `Chi tiêu: ${expenseDesc.trim()}`,
          });

        if (fundErr) throw fundErr;

        // Also add into expenses list for record but WITHOUT creating splits (so no debt is generated)
        const { error: expErr } = await supabase
          .from("expenses")
          .insert({
            room_id: room.id,
            description: `[QUỸ PHÒNG] ${expenseDesc.trim()}`,
            amount: amountNum,
            paid_by: user.id,
            category: "Sinh hoạt",
          });

        if (expErr) throw expErr;

        setActionSuccess("Đã thanh toán bằng Quỹ phòng thành công!");
      } else {
        // 2. Normal split expense
        const { data: newExpense, error: expErr } = await supabase
          .from("expenses")
          .insert({
            room_id: room.id,
            description: expenseDesc.trim(),
            amount: amountNum,
            paid_by: user.id,
            category: expenseCategory,
          })
          .select()
          .single();

        if (expErr) throw expErr;

        const splitAmount = amountNum / members.length;
        const splitsData = members.map((m) => ({
          expense_id: newExpense.id,
          user_id: m.user_id,
          amount: splitAmount,
        }));

        const { error: splitErr } = await supabase
          .from("expense_splits")
          .insert(splitsData);

        if (splitErr) throw splitErr;

        setActionSuccess("Đã lưu khoản chi phòng!");
      }

      setExpenseDesc("");
      setExpenseAmount("");
      setIsFundPayment(false);
      if (profile) await loadRoomData(profile.id);
    } catch (err: any) {
      setActionError(err.message || "Lỗi lưu chi tiêu chung.");
    }
  };

  // Add Item to Catalog
  const handleAddCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice || !room) return;

    const priceNum = Number(newItemPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setActionError("Giá tiền mặt hàng không hợp lệ!");
      return;
    }

    try {
      const { error } = await supabase
        .from("room_catalog_items")
        .insert({
          room_id: room.id,
          name: newItemName.trim(),
          default_price: priceNum,
          emoji: newItemEmoji,
        });

      if (error) throw error;

      setActionSuccess("Đã lưu sản phẩm mới vào kho đồ dùng chung!");
      setNewItemName("");
      setNewItemPrice("");
      setNewItemEmoji("📦");
      setShowCatalogModal(false);
      if (profile) await loadRoomData(profile.id);
    } catch (err: any) {
      setActionError(err.message || "Lỗi thêm đồ dùng vào kho.");
    }
  };

  // Contribute to Room Fund
  const handleDepositFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundAmount || !room) return;
    setActionError("");

    const amountNum = Number(fundAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setActionError("Số tiền nạp quỹ phải lớn hơn 0!");
      return;
    }

    try {
      const { error } = await supabase
        .from("room_fund_transactions")
        .insert({
          room_id: room.id,
          user_id: user.id,
          amount: amountNum,
          description: fundDesc.trim(),
        });

      if (error) throw error;

      // Add to expenses list as a special deposit record but WITHOUT creating splits
      const { error: expErr } = await supabase
        .from("expenses")
        .insert({
          room_id: room.id,
          description: `[NẠP QUỸ] ${fundDesc.trim()}`,
          amount: amountNum,
          paid_by: user.id,
          category: "Dịch vụ khác",
        });

      if (expErr) throw expErr;

      setActionSuccess(`Đã nạp ${amountNum.toLocaleString("vi-VN")}đ vào quỹ phòng!`);
      setFundAmount("");
      setFundDesc("Đóng tiền quỹ phòng");
      if (profile) await loadRoomData(profile.id);
    } catch (err: any) {
      setActionError(err.message || "Lỗi nạp quỹ.");
    }
  };

  // Submit Settlement Request (Report payment completed)
  const handleReportPaid = async () => {
    if (!activePayDebt || !room) return;
    setActionError("");

    try {
      const { error } = await supabase
        .from("debt_settlements")
        .insert({
          room_id: room.id,
          debtor_id: user.id,
          creditor_id: activePayDebt.creditorId,
          amount: activePayDebt.amount,
          status: "pending",
        });

      if (error) throw error;

      setActionSuccess(`Gửi yêu cầu báo đã trả ${activePayDebt.amount.toLocaleString("vi-VN")}đ cho ${activePayDebt.creditorName}! Chờ duyệt.`);
      setActivePayDebt(null);
      if (profile) await loadRoomData(profile.id);
    } catch (err: any) {
      setActionError(err.message || "Lỗi tạo yêu cầu trả nợ.");
    }
  };

  // Approve / Reject Settlement Request
  const handleApproveSettlement = async (id: string, approve: boolean) => {
    try {
      const { error } = await supabase
        .from("debt_settlements")
        .update({
          status: approve ? "approved" : "rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      setActionSuccess(approve ? "Đã duyệt và xác nhận xoá nợ!" : "Đã bác bỏ yêu cầu trả nợ.");
      if (profile) await loadRoomData(profile.id);
    } catch (err: any) {
      setActionError(err.message || "Lỗi cập nhật yêu cầu trả nợ.");
    }
  };

  const handleCopyBillSummary = (bill: RoomBill) => {
    const shareAmount = Number(bill.total_amount) / members.length;
    const summaryText = `🏠 BIÊN LAI CHIA TIỀN PHÒNG THÁNG ${bill.bill_month}
--------------------------------------
Tổng hoá đơn: ${Number(bill.total_amount).toLocaleString("vi-VN")}đ (${members.length} người)
Mỗi thành viên đóng: ${Math.round(shareAmount).toLocaleString("vi-VN")}đ

Chi tiết chi phí:
- Tiền phòng: ${Number(bill.rent_amount).toLocaleString("vi-VN")}đ
- Tiền điện: ${Number(bill.electricity_amount).toLocaleString("vi-VN")}đ
- Tiền nước: ${Number(bill.water_amount).toLocaleString("vi-VN")}đ
- Mạng Internet: ${Number(bill.internet_amount).toLocaleString("vi-VN")}đ
- Dịch vụ khác/Phụ phí: ${Number(bill.services_amount).toLocaleString("vi-VN")}đ

👉 Các bạn hãy truy cập TroMate để quét mã QR chuyển khoản trả nợ nhanh nhé!`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(summaryText);
      setActionSuccess(`Đã copy tóm tắt biên lai tháng ${bill.bill_month}! Hãy dán vào Zalo/Messenger.`);
    } else {
      setActionError("Trình duyệt không hỗ trợ copy nhanh.");
    }
  };

  // Calculate bill amounts
  const calcElectricAmount = () => {
    const diff = Number(elecNew) - Number(elecOld);
    return diff > 0 ? diff * Number(elecRate) : 0;
  };

  const calcWaterAmount = () => {
    return Number(waterRate) * members.length;
  };

  const calcTotalBillAmount = () => {
    return (
      Number(rentAmount) +
      calcElectricAmount() +
      calcWaterAmount() +
      Number(internetAmount) +
      Number(otherServicesAmount)
    );
  };

  // Submit Monthly Room Bill with file upload
  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;
    setActionError("");
    setBillUploading(true);

    let imageUrl = "";

    try {
      if (billFile) {
        const fileExt = billFile.name.split(".").pop();
        const fileName = `${room.id}-${Date.now()}.${fileExt}`;
        const filePath = `bill_photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("bills")
          .upload(filePath, billFile, { cacheControl: "3600", upsert: true });

        if (uploadError) {
          throw new Error("Lỗi upload ảnh: " + uploadError.message);
        }

        const { data } = supabase.storage.from("bills").getPublicUrl(filePath);
        imageUrl = data.publicUrl;
      }

      const totalAmount = calcTotalBillAmount();
      const { error: billErr } = await supabase.from("room_bills").insert({
        room_id: room.id,
        bill_month: billMonth,
        image_url: imageUrl || null,
        rent_amount: Number(rentAmount),
        electricity_amount: calcElectricAmount(),
        water_amount: calcWaterAmount(),
        internet_amount: Number(internetAmount),
        services_amount: Number(otherServicesAmount),
        total_amount: totalAmount,
        paid_by: billPayer,
      });

      if (billErr) throw billErr;

      setActionSuccess(`Đã lưu hoá đơn tháng ${billMonth} thành công!`);
      setBillFile(null);
      
      const fileInput = document.getElementById("bill-file") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      if (profile) await loadRoomData(profile.id);
    } catch (err: any) {
      setActionError(err.message || "Lỗi lưu hoá đơn tháng.");
    } finally {
      setBillUploading(false);
    }
  };

  // Ghi chi tiêu cá nhân
  const handleAddPersonalExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personalDesc.trim() || !personalAmount) return;
    setActionError("");

    const amountNum = Number(personalAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setActionError("Số tiền phải lớn hơn 0!");
      return;
    }

    try {
      const { error } = await supabase.from("personal_expenses").insert({
        user_id: user.id,
        description: personalDesc.trim(),
        amount: amountNum,
        category: personalCategory,
      });

      if (error) throw error;

      setActionSuccess("Đã ghi chi tiêu riêng tư!");
      setPersonalDesc("");
      setPersonalAmount("");
      if (profile) await loadPersonalExpenses(profile.id);
    } catch (err: any) {
      setActionError(err.message || "Lỗi lưu chi tiêu cá nhân.");
    }
  };

  // Delete Personal Expense
  const handleDeletePersonalExpense = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xoá khoản chi cá nhân này không?")) return;
    try {
      const { error } = await supabase
        .from("personal_expenses")
        .delete()
        .eq("id", id);
      if (error) throw error;

      setActionSuccess("Đã xoá chi tiêu cá nhân.");
      if (profile) await loadPersonalExpenses(profile.id);
    } catch (err: any) {
      setActionError(err.message || "Lỗi xoá chi tiêu.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // Calculate Category Breakdowns for the Donut/Spend Chart widget
  const getCategorySpendData = () => {
    const categoryTotals: { [key: string]: number } = {};
    let total = 0;

    // Sum from standard room expenses
    expenses.forEach((e) => {
      const cat = e.category || "Khác";
      const amt = Number(e.amount);
      if (e.description.includes("[NẠP QUỸ]") || e.description.includes("[QUỸ PHÒNG]")) {
        // Skip internal fund records in general spending stats to avoid double counting
        return;
      }
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
      total += amt;
    });

    // Sum from monthly bills
    roomBills.forEach((b) => {
      categoryTotals["Tiền nhà"] = (categoryTotals["Tiền nhà"] || 0) + Number(b.rent_amount);
      categoryTotals["Tiền điện"] = (categoryTotals["Tiền điện"] || 0) + Number(b.electricity_amount);
      categoryTotals["Tiền nước"] = (categoryTotals["Tiền nước"] || 0) + Number(b.water_amount);
      categoryTotals["Mạng Internet"] = (categoryTotals["Mạng Internet"] || 0) + Number(b.internet_amount);
      categoryTotals["Dịch vụ khác"] = (categoryTotals["Dịch vụ khác"] || 0) + Number(b.services_amount);
      
      total += Number(b.total_amount);
    });

    return {
      totals: Object.keys(categoryTotals).map((cat) => ({
        category: cat,
        amount: categoryTotals[cat],
        percentage: total > 0 ? Math.round((categoryTotals[cat] / total) * 100) : 0,
      })).sort((a, b) => b.amount - a.amount),
      total,
    };
  };

  const spendAnalytics = getCategorySpendData();
  const totalPersonalSpent = personalExpenses.reduce((sum, item) => sum + Number(item.amount), 0);

  // Map debtor/creditor display names safely
  const getMemberName = (id: string) => {
    return members.find((m) => m.user_id === id)?.profiles.display_name || "Ẩn danh";
  };

  // Get Creditor bank settings for VietQR Generation
  const getCreditorBankInfo = (id: string) => {
    const mem = members.find((m) => m.user_id === id);
    return mem?.profiles || null;
  };

  const activeCreditorProfile = activePayDebt ? getCreditorBankInfo(activePayDebt.creditorId) : null;
  const qrCodeUrl = activePayDebt && activeCreditorProfile?.bank_account && activeCreditorProfile?.bank_id
    ? `https://img.vietqr.io/image/${activeCreditorProfile.bank_id}-${activeCreditorProfile.bank_account}-compact2.png?amount=${activePayDebt.amount}&addInfo=${encodeURIComponent(`TroMate ${profile?.display_name || "Thanh vien"} tra no`)}&accountName=${encodeURIComponent(activeCreditorProfile.bank_owner_name || "")}`
    : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-16 font-sans antialiased text-gray-900">
      
      {/* ── Top Bar ────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-extrabold shadow-sm shadow-emerald-200">
              T
            </span>
            <span className="font-bold text-gray-800 text-base">
              Tro<span className="text-emerald-600">Mate</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {room && (
              <button
                onClick={() => setShowBankModal(true)}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                💳 Cài đặt nhận tiền VietQR
              </button>
            )}
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-gray-800">
                {profile?.display_name || user?.email}
              </p>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Thành viên phòng</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-5 mt-6">
        {/* Success/Error Alerts */}
        {actionError && (
          <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800 flex justify-between items-center shadow-sm">
            <span>{actionError}</span>
            <button onClick={() => setActionError("")} className="text-rose-500 font-bold text-lg leading-none">×</button>
          </div>
        )}
        {actionSuccess && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 flex justify-between items-center shadow-sm">
            <span>{actionSuccess}</span>
            <button onClick={() => setActionSuccess("")} className="text-emerald-500 font-bold text-lg leading-none">×</button>
          </div>
        )}

        {/* ── CASE 1: NOT IN A ROOM ─────────────────────────── */}
        {!room ? (
          <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 text-center">
              Chào mừng bạn đến với TroMate!
            </h2>
            <p className="text-center text-gray-500 mt-2 text-sm">
              Bạn chưa tham gia phòng trọ nào. Hãy tạo phòng mới hoặc gia nhập cùng các bạn của mình.
            </p>

            <div className="grid gap-8 mt-10 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
              {/* Create Room Form */}
              <div className="pt-6 sm:pt-0 sm:pr-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  🏠 Tạo phòng mới
                </h3>
                <form onSubmit={handleCreateRoom} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase">Tên phòng trọ</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Phòng 302, Trọ Hoa Mai"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-950 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                  >
                    Tạo phòng
                  </button>
                </form>
              </div>

              {/* Join Room Form */}
              <div className="pt-8 sm:pt-0 sm:pl-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  🔑 Tham gia phòng trọ
                </h3>
                <form onSubmit={handleJoinRoom} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase">Mã mời (6 chữ số)</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="Nhập mã 6 chữ số"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-950 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm tracking-widest text-center uppercase font-bold"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
                  >
                    Tham gia
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          /* ── CASE 2: DASHBOARD MAIN WORKSPACE ───────────────── */
          <div className="space-y-6">
            
            {/* Header Room details */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Phòng đang quản lý</span>
                <h2 className="text-xl font-bold text-gray-900 mt-0.5">{room.name}</h2>
              </div>
              
              {/* Room Wallet (Quỹ phòng) Widget */}
              <div className="flex items-center gap-6 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-md shadow-emerald-100 flex-1 sm:max-w-xs sm:flex-initial">
                <div className="flex-1">
                  <p className="text-[10px] uppercase font-bold text-emerald-100 tracking-wider">Số dư Quỹ phòng</p>
                  <p className="text-xl font-extrabold mt-0.5">{fundBalance.toLocaleString("vi-VN")}đ</p>
                </div>
                <div className="flex -space-x-1 sm:-space-x-2">
                  <span className="text-2xl">👛</span>
                </div>
              </div>

              {/* Invite Code */}
              <div className="flex items-center gap-3 bg-emerald-50 rounded-xl px-4 py-2 border border-emerald-100">
                <div>
                  <p className="text-[9px] uppercase font-bold text-emerald-700 tracking-wider">Mã mời thành viên</p>
                  <p className="text-base font-mono font-bold text-emerald-800 tracking-widest uppercase">{room.invite_code}</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(room.invite_code);
                    setActionSuccess("Đã copy mã mời!");
                  }}
                  className="rounded-lg bg-white p-1 text-emerald-700 hover:bg-emerald-100 shadow-sm border border-emerald-200 transition-colors"
                  title="Copy mã mời"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
              </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex border-b border-gray-200 bg-white rounded-xl p-1 shadow-sm gap-1">
              <button
                onClick={() => setActiveTab("room-expenses")}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                  activeTab === "room-expenses"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                }`}
              >
                👥 Chi tiêu chung & Quỹ phòng
              </button>
              <button
                onClick={() => setActiveTab("monthly-bills")}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                  activeTab === "monthly-bills"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                }`}
              >
                📄 Hoá đơn tiền trọ
              </button>
              <button
                onClick={() => setActiveTab("personal-expenses")}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                  activeTab === "personal-expenses"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                }`}
              >
                👤 Chi tiêu cá nhân
              </button>
            </div>

            {/* ── TAB 1: ROOM EXPENSES & FUND ─────────────────────── */}
            {activeTab === "room-expenses" && (
              <div className="space-y-6">
                
                {/* Pending Approve Requests */}
                {settlements.some((s) => s.status === "pending") && (
                  <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 shadow-sm space-y-3">
                    <h4 className="text-sm font-bold text-amber-800 flex items-center gap-1.5">
                      ⏳ Đang chờ xác nhận giao dịch trả nợ
                    </h4>
                    <div className="space-y-2">
                      {settlements
                        .filter((s) => s.status === "pending")
                        .map((set) => {
                          const isDebtor = set.debtor_id === user.id;
                          const isCreditor = set.creditor_id === user.id;
                          
                          return (
                            <div
                              key={set.id}
                              className="bg-white rounded-xl border border-amber-200/60 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                            >
                              <div>
                                <span className="font-semibold text-gray-900">{getMemberName(set.debtor_id)}</span>
                                <span className="text-gray-400 mx-1">báo đã chuyển</span>
                                <span className="font-bold text-emerald-700">{set.amount.toLocaleString("vi-VN")}đ</span>
                                <span className="text-gray-400 mx-1">cho</span>
                                <span className="font-semibold text-gray-900">{getMemberName(set.creditor_id)}</span>
                              </div>
                              
                              <div className="flex gap-2">
                                {isCreditor ? (
                                  <>
                                    <button
                                      onClick={() => handleApproveSettlement(set.id, true)}
                                      className="rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white hover:bg-emerald-700"
                                    >
                                      ✓ Xác nhận đã nhận tiền
                                    </button>
                                    <button
                                      onClick={() => handleApproveSettlement(set.id, false)}
                                      className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-1.5 font-semibold text-rose-700 hover:bg-rose-100"
                                    >
                                      Từ chối
                                    </button>
                                  </>
                                ) : isDebtor ? (
                                  <span className="text-amber-600 font-semibold italic bg-amber-50 rounded px-2.5 py-1">
                                    Chờ {getMemberName(set.creditor_id)} kiểm tra duyệt nợ
                                  </span>
                                ) : (
                                  <span className="text-gray-400 italic bg-gray-50 rounded px-2.5 py-1">
                                    Đang giao dịch
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Who owes who (VietQR integrations) */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3 mb-4">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white font-bold text-sm">
                      ⚡
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">Chi tiết thanh toán (Ai nợ ai)</h3>
                  </div>

                  {debts.length === 0 ? (
                    <div className="text-center py-6">
                      <span className="text-3xl">🎉</span>
                      <p className="text-xs text-gray-400 mt-2">Phòng trọ đang rất cân bằng! Không ai nợ ai tiền.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {debts.map((debt, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 hover:bg-amber-50/20 hover:border-amber-100 transition-all shadow-sm"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-semibold text-gray-800 text-sm">{debt.from}</span>
                            <span className="text-xs text-gray-400">cần trả</span>
                            <span className="font-semibold text-emerald-700 text-sm">{debt.to}</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-rose-600 text-sm">
                              {debt.amount.toLocaleString("vi-VN")}đ
                            </span>
                            
                            {debt.fromId === user.id && (
                              <button
                                onClick={() => setActivePayDebt({ creditorId: debt.toId, creditorName: debt.to, amount: debt.amount })}
                                className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                              >
                                Trả nợ nhanh
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Main room spending grids */}
                <div className="grid gap-6 lg:grid-cols-5">
                  {/* Left Column: Form expense & Quick Selection Catalog */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Catalog Quick Grid */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                        <h4 className="text-xs font-bold text-gray-800">📦 Kho đồ dùng chọn nhanh</h4>
                        <button
                          onClick={() => setShowCatalogModal(true)}
                          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                        >
                          ＋ Thêm đồ mới
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 max-h-[170px] overflow-y-auto pr-1">
                        {catalogItems.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setExpenseDesc(item.name);
                              setExpenseAmount(item.default_price.toString());
                              setExpenseCategory("Sinh hoạt");
                            }}
                            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-2 text-left text-xs font-semibold text-gray-700 hover:border-emerald-500 hover:bg-emerald-50/30 hover:text-emerald-800 transition-all shadow-sm"
                          >
                            <span className="text-base">{item.emoji}</span>
                            <div className="truncate">
                              <p className="font-bold text-gray-900 truncate">{item.name}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{item.default_price.toLocaleString("vi-VN")}đ</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Expense Form */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                      <h3 className="text-xs font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4">
                        📝 Thêm khoản chi mới
                      </h3>
                      <form onSubmit={handleAddExpense} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase">Tên khoản chi</label>
                          <input
                            type="text"
                            required
                            placeholder="Tự nhập hoặc chọn nhanh bên trên"
                            value={expenseDesc}
                            onChange={(e) => setExpenseDesc(e.target.value)}
                            className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-gray-950 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase">Số tiền (đ)</label>
                          <input
                            type="number"
                            required
                            min={1}
                            placeholder="Nhập số tiền mua"
                            value={expenseAmount}
                            onChange={(e) => setExpenseAmount(e.target.value)}
                            className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-gray-950 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                          />
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <label className="block text-xs font-semibold text-gray-500 uppercase">Danh mục</label>
                            <select
                              value={expenseCategory}
                              onChange={(e) => setExpenseCategory(e.target.value)}
                              className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-950 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                            >
                              <option value="Ăn uống">Ăn uống chung</option>
                              <option value="Sinh hoạt">Sinh hoạt chung</option>
                              <option value="Gia vị">Gia vị / Đồ bếp</option>
                              <option value="Tiện ích">Tiện ích</option>
                              <option value="Khác">Khác</option>
                            </select>
                          </div>
                          
                          <div className="pt-6">
                            <label className="flex items-center gap-2 select-none cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isFundPayment}
                                onChange={(e) => setIsFundPayment(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className="text-xs font-bold text-emerald-700">Chi từ Quỹ phòng</span>
                            </label>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 shadow-md shadow-emerald-100 transition-colors"
                        >
                          {isFundPayment ? "Trừ thẳng tiền Quỹ phòng" : "Ghi & Tự động chia tiền"}
                        </button>
                      </form>
                    </div>

                    {/* Room Fund Top-up Widget */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                      <h4 className="text-xs font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4">
                        👛 Đóng nạp quỹ phòng trọ
                      </h4>
                      <form onSubmit={handleDepositFund} className="space-y-3.5">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <input
                              type="number"
                              required
                              placeholder="Số tiền góp"
                              value={fundAmount}
                              onChange={(e) => setFundAmount(e.target.value)}
                              className="block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-950 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              required
                              value={fundDesc}
                              onChange={(e) => setFundDesc(e.target.value)}
                              className="block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-950 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="w-full rounded-xl border border-emerald-600 text-emerald-700 font-bold bg-white hover:bg-emerald-50 py-2 text-xs transition-colors"
                        >
                          Góp tiền nạp Quỹ phòng
                        </button>
                      </form>
                    </div>

                    {/* Room Members List Widget */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                      <h4 className="text-xs font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 flex items-center gap-1.5">
                        👥 Thành viên phòng ({members.length})
                      </h4>
                      <div className="space-y-3.5">
                        {members.map((m) => (
                          <div key={m.user_id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white font-bold text-xs">
                                {m.profiles.display_name.charAt(0).toUpperCase()}
                              </span>
                              <div>
                                <p className="font-bold text-gray-950">{m.profiles.display_name}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  {m.user_id === user.id ? "Tài khoản của bạn" : "Bạn cùng phòng"}
                                </p>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              {m.profiles.bank_account && m.profiles.bank_id ? (
                                <span className="inline-block font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 text-[10px] uppercase">
                                  🏦 {m.profiles.bank_id} - {m.profiles.bank_account}
                                </span>
                              ) : (
                                <span className="inline-block text-[10px] text-gray-400 font-semibold italic bg-gray-50 px-2 py-1 rounded-lg border border-gray-200/50">
                                  Chưa cài đặt VietQR
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Analytics Spend Chart & History */}
                  <div className="lg:col-span-3 space-y-6">
                    
                    {/* SVG Spending Analytics Progress Bars */}
                    {spendAnalytics.total > 0 && (
                      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4">
                          📊 Biểu đồ phân bổ chi tiêu tháng này
                        </h3>
                        
                        <div className="space-y-3.5">
                          {/* Segmented horizontal bar */}
                          <div className="h-4 w-full rounded-full bg-gray-100 overflow-hidden flex">
                            {spendAnalytics.totals.map((item, idx) => (
                              <div
                                key={idx}
                                className={`${CATEGORY_COLORS[item.category] || "bg-gray-400"} h-full`}
                                style={{ width: `${item.percentage}%` }}
                                title={`${item.category}: ${item.percentage}%`}
                              />
                            ))}
                          </div>

                          {/* Category listing with progress bars */}
                          <div className="grid gap-3 sm:grid-cols-2 pt-2">
                            {spendAnalytics.totals.map((item, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="flex justify-between text-xs font-semibold">
                                  <span className="flex items-center gap-1.5">
                                    <span className={`inline-block h-2 w-2 rounded-full ${CATEGORY_COLORS[item.category] || "bg-gray-400"}`} />
                                    {item.category}
                                  </span>
                                  <span className="text-gray-500">
                                    {item.amount.toLocaleString("vi-VN")}đ ({item.percentage}%)
                                  </span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${CATEGORY_COLORS[item.category] || "bg-gray-400"}`}
                                    style={{ width: `${item.percentage}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Spend lists */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4">
                        📊 Lịch sử chi tiêu phòng
                      </h3>

                      {expenses.length === 0 ? (
                        <div className="text-center py-12">
                          <span className="text-2xl text-gray-300">📝</span>
                          <p className="text-xs text-gray-400 mt-2">Chưa có khoản chi tiêu nào được ghi.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100 max-h-[380px] overflow-y-auto pr-1">
                          {expenses.map((exp) => (
                            <div key={exp.id} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                              <div className="flex items-center gap-3">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs">
                                  {exp.profiles?.display_name?.charAt(0).toUpperCase()}
                                </span>
                                <div>
                                  <p className="font-semibold text-gray-800 text-xs">{exp.description}</p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">
                                    Bởi: <span className="font-medium text-gray-600">{exp.profiles?.display_name}</span> • {new Date(exp.created_at).toLocaleDateString("vi-VN")}
                                  </p>
                                </div>
                              </div>
                              <span className="font-bold text-gray-900 text-xs">
                                {Number(exp.amount).toLocaleString("vi-VN")}đ
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: MONTHLY BILLS ────────────────────────────── */}
            {activeTab === "monthly-bills" && (
              <div className="grid gap-6 lg:grid-cols-5">
                {/* Form add monthly bill */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm h-fit">
                  <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">
                    📄 Nhập hoá đơn tiền trọ tháng
                  </h3>

                  <form onSubmit={handleAddBill} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase">Tháng hoá đơn</label>
                        <input
                          type="month"
                          required
                          value={billMonth}
                          onChange={(e) => setBillMonth(e.target.value)}
                          className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-950 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase">Người trả hộ</label>
                        <select
                          value={billPayer}
                          onChange={(e) => setBillPayer(e.target.value)}
                          className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-950 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                        >
                          {members.map((m) => (
                            <option key={m.user_id} value={m.user_id}>
                              {m.profiles.display_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase">Tiền phòng (đ)</label>
                      <input
                        type="number"
                        required
                        value={rentAmount}
                        onChange={(e) => setRentAmount(e.target.value)}
                        className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-950 text-sm"
                      />
                    </div>

                    {/* Electricity detail */}
                    <div className="rounded-xl border border-gray-200 p-3 bg-gray-50 space-y-2">
                      <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">⚡ Tiền Điện</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-500 uppercase">Chỉ số cũ</label>
                          <input
                            type="number"
                            value={elecOld}
                            onChange={(e) => setElecOld(e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-gray-950 text-xs text-center"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 uppercase">Chỉ số mới</label>
                          <input
                            type="number"
                            value={elecNew}
                            onChange={(e) => setElecNew(e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-gray-950 text-xs text-center"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 uppercase">Đơn giá/kWh</label>
                          <input
                            type="number"
                            value={elecRate}
                            onChange={(e) => setElecRate(e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-gray-950 text-xs text-center"
                          />
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-gray-500 text-right">
                        Điện: <span className="font-bold text-emerald-700">{calcElectricAmount().toLocaleString("vi-VN")}đ</span> ({Number(elecNew) - Number(elecOld)} số)
                      </p>
                    </div>

                    {/* Water detail */}
                    <div className="rounded-xl border border-gray-200 p-3 bg-gray-50 space-y-2">
                      <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">💧 Tiền Nước</p>
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-xs text-gray-500">Đơn giá/Người:</span>
                        <input
                          type="number"
                          value={waterRate}
                          onChange={(e) => setWaterRate(e.target.value)}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-gray-950 text-xs w-28 text-right font-semibold"
                        />
                      </div>
                      <p className="text-xs font-semibold text-gray-500 text-right">
                        Nước ({members.length} người): <span className="font-bold text-emerald-700">{calcWaterAmount().toLocaleString("vi-VN")}đ</span>
                      </p>
                    </div>

                    {/* Internet & Others */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase">Mạng Internet (đ)</label>
                        <input
                          type="number"
                          value={internetAmount}
                          onChange={(e) => setInternetAmount(e.target.value)}
                          className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-950 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase">Dịch vụ khác/Phụ phí</label>
                        <input
                          type="number"
                          value={otherServicesAmount}
                          onChange={(e) => setOtherServicesAmount(e.target.value)}
                          className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-950 text-sm"
                        />
                      </div>
                    </div>

                    {/* Photo upload */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase">Ảnh phiếu báo nhà</label>
                      <input
                        id="bill-file"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setBillFile(e.target.files?.[0] || null)}
                        className="mt-1.5 block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                      />
                    </div>

                    {/* Live Total */}
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-700">TỔNG HOÁ ĐƠN:</span>
                        <span className="text-base font-extrabold text-emerald-600">
                          {calcTotalBillAmount().toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 text-right mt-0.5">
                        Mỗi thành viên đóng: {(calcTotalBillAmount() / members.length).toLocaleString("vi-VN")}đ
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={billUploading}
                      className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 shadow-md shadow-emerald-100 transition-colors disabled:opacity-50"
                    >
                      {billUploading ? "Đang lưu hoá đơn..." : "Ghi & Chia tiền Hoá Đơn"}
                    </button>
                  </form>
                </div>

                {/* Right Column: Bills history list */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-fit">
                  <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-5">
                    📊 Lịch sử hoá đơn tháng
                  </h3>

                  {roomBills.length === 0 ? (
                    <div className="text-center py-12">
                      <span className="text-3xl text-gray-300">📄</span>
                      <p className="text-sm text-gray-400 mt-2">Chưa lưu hoá đơn tháng nào.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1">
                      {roomBills.map((bill) => (
                        <div
                          key={bill.id}
                          className="rounded-xl border border-gray-200 p-4 shadow-sm space-y-3 bg-white hover:border-emerald-300 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-gray-800 text-sm">Hóa đơn tháng {bill.bill_month}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                Người đóng: <span className="font-semibold text-gray-600">{bill.profiles.display_name}</span>
                              </p>
                            </div>
                            <span className="font-extrabold text-emerald-600 text-sm">
                              {Number(bill.total_amount).toLocaleString("vi-VN")}đ
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 border-t border-gray-100 pt-3 text-[10px] text-gray-500 font-semibold uppercase">
                            <div className="bg-gray-50 rounded px-2 py-1.5">
                              <span className="block text-gray-400">Tiền phòng</span>
                              <span className="block font-bold text-gray-800 mt-0.5">{Number(bill.rent_amount).toLocaleString("vi-VN")}đ</span>
                            </div>
                            <div className="bg-gray-50 rounded px-2 py-1.5">
                              <span className="block text-gray-400">Tiền điện</span>
                              <span className="block font-bold text-gray-800 mt-0.5">{Number(bill.electricity_amount).toLocaleString("vi-VN")}đ</span>
                            </div>
                            <div className="bg-gray-50 rounded px-2 py-1.5">
                              <span className="block text-gray-400">Tiền nước</span>
                              <span className="block font-bold text-gray-800 mt-0.5">{Number(bill.water_amount).toLocaleString("vi-VN")}đ</span>
                            </div>
                            <div className="bg-gray-50 rounded px-2 py-1.5">
                              <span className="block text-gray-400">Internet</span>
                              <span className="block font-bold text-gray-800 mt-0.5">{Number(bill.internet_amount).toLocaleString("vi-VN")}đ</span>
                            </div>
                            <div className="bg-gray-50 rounded px-2 py-1.5 col-span-2 sm:col-span-1">
                              <span className="block text-gray-400">Dịch vụ khác</span>
                              <span className="block font-bold text-gray-800 mt-0.5">{Number(bill.services_amount).toLocaleString("vi-VN")}đ</span>
                            </div>
                          </div>

                          <div className="pt-2 flex items-center justify-between gap-3 border-t border-gray-100/50">
                            {bill.image_url ? (
                              <button
                                onClick={() => setSelectedBillPhoto(bill.image_url || null)}
                                className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold hover:underline"
                              >
                                🖼️ Xem ảnh hoá đơn
                              </button>
                            ) : (
                              <span className="text-[10px] text-gray-400 font-medium">Không có ảnh đính kèm</span>
                            )}
                            <button
                              onClick={() => handleCopyBillSummary(bill)}
                              className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg font-bold transition-colors"
                            >
                              📋 Copy tóm tắt gửi nhóm
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 3: PERSONAL PRIVATE SPENDS ──────────────────── */}
            {activeTab === "personal-expenses" && (
              <div className="space-y-6">
                {/* Budget Tracker Widget */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800">🎯 Hạn mức chi tiêu cá nhân tháng này</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Đặt mục tiêu kiểm soát ngân sách cá nhân của bạn</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-gray-500">Hạn mức (đ):</label>
                      <input
                        type="number"
                        placeholder="Ví dụ: 2000000"
                        value={personalBudget}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPersonalBudget(Number(val));
                          if (typeof window !== "undefined") {
                            localStorage.setItem("personal_budget", val);
                          }
                        }}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-gray-950 text-xs w-32 text-right font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {personalBudget > 0 ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-gray-500">
                          Đã tiêu: <span className="font-bold text-gray-800">{totalPersonalSpent.toLocaleString("vi-VN")}đ</span> / {personalBudget.toLocaleString("vi-VN")}đ
                        </span>
                        <span className={`${
                          (totalPersonalSpent / personalBudget) >= 1
                            ? "text-rose-600 font-extrabold"
                            : (totalPersonalSpent / personalBudget) >= 0.8
                            ? "text-amber-600 font-bold"
                            : "text-emerald-700 font-bold"
                        }`}>
                          {Math.round((totalPersonalSpent / personalBudget) * 100)}%
                        </span>
                      </div>
                      
                      <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            (totalPersonalSpent / personalBudget) >= 1
                              ? "bg-rose-500"
                              : (totalPersonalSpent / personalBudget) >= 0.8
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min((totalPersonalSpent / personalBudget) * 100, 100)}%` }}
                        />
                      </div>

                      {(totalPersonalSpent / personalBudget) >= 1 ? (
                        <p className="text-xs text-rose-600 font-bold flex items-center gap-1 mt-1 animate-pulse">
                          ⚠️ Bạn đã tiêu quá hạn mức đã đặt ra cho tháng này!
                        </p>
                      ) : (totalPersonalSpent / personalBudget) >= 0.8 ? (
                        <p className="text-xs text-amber-600 font-bold mt-1">
                          ⚠️ Cẩn thận! Bạn đã tiêu gần hết hạn mức tháng này.
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Nhập hạn mức ở trên để kích hoạt theo dõi chi tiêu cá nhân.</p>
                  )}
                </div>

                <div className="grid gap-6 lg:grid-cols-5">
                {/* Form add private spend */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm h-fit">
                  <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4">
                    👤 Ghi chép chi tiêu cá nhân riêng tư
                  </h3>
                  <p className="text-xs text-rose-500 mb-4 font-semibold">
                    🔒 Chỉ tài khoản của bạn mới xem được thông tin này. Bạn cùng phòng không thấy.
                  </p>

                  <form onSubmit={handleAddPersonalExpense} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase">Tên khoản chi</label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Ăn cơm trưa, mua quần áo..."
                        value={personalDesc}
                        onChange={(e) => setPersonalDesc(e.target.value)}
                        className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-950 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase">Số tiền (đ)</label>
                      <input
                        type="number"
                        required
                        min={1}
                        placeholder="Ví dụ: 50000"
                        value={personalAmount}
                        onChange={(e) => setPersonalAmount(e.target.value)}
                        className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-950 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase">Danh mục</label>
                      <select
                        value={personalCategory}
                        onChange={(e) => setPersonalCategory(e.target.value)}
                        className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-950 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                      >
                        <option value="Ăn uống">Ăn uống / Coffee</option>
                        <option value="Mua sắm">Mua sắm / Quần áo</option>
                        <option value="Đi lại">Xăng xe / Đi lại</option>
                        <option value="Học tập">Học tập / Sách vở</option>
                        <option value="Giải trí">Xem phim / Game / Giải trí</option>
                        <option value="Cá nhân">Cá nhân khác</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 shadow-md shadow-emerald-100 transition-colors"
                    >
                      Ghi chi tiêu cá nhân
                    </button>
                  </form>
                </div>

                {/* Private List */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-5">
                    <h3 className="text-lg font-bold text-gray-900">
                      📊 Lịch sử chi tiêu riêng tư
                    </h3>
                    <div className="text-right">
                      <span className="text-[9px] text-gray-400 font-bold uppercase block">Tổng chi cá nhân</span>
                      <span className="font-extrabold text-emerald-600 text-base">{totalPersonalSpent.toLocaleString("vi-VN")}đ</span>
                    </div>
                  </div>

                  {personalExpenses.length === 0 ? (
                    <div className="text-center py-12">
                      <span className="text-3xl text-gray-300">🔒</span>
                      <p className="text-sm text-gray-400 mt-2">Chưa lưu chi tiêu riêng tư nào.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-[460px] overflow-y-auto pr-1">
                      {personalExpenses.map((exp) => (
                        <div key={exp.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0 group">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 text-sm">
                              👤
                            </span>
                            <div>
                              <p className="font-semibold text-gray-800 text-xs">{exp.description}</p>
                              <p className="text-[9px] text-gray-400 mt-0.5">
                                Danh mục: <span className="font-medium text-gray-600">{exp.category}</span> • {new Date(exp.created_at).toLocaleDateString("vi-VN")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-gray-950 text-xs">
                              {Number(exp.amount).toLocaleString("vi-VN")}đ
                            </span>
                            <button
                              onClick={() => handleDeletePersonalExpense(exp.id)}
                              className="text-rose-500 hover:text-rose-700 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold px-2 py-1 rounded hover:bg-rose-50"
                              title="Xoá chi tiêu"
                            >
                              Xoá
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          </div>
        )}
      </main>

      {/* ── MODAL: SAVE BANK SETTINGS (VIETQR CONFIG) ──────────── */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-gray-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-gray-900">💳 Cài đặt tài khoản ngân hàng</h3>
              <button onClick={() => setShowBankModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleSaveBankSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase">Ngân hàng</label>
                <select
                  value={bankId}
                  onChange={(e) => setBankId(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-950 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                >
                  {BANK_LIST.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase">Số tài khoản (STK)</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập STK ngân hàng của bạn"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-950 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase">Tên chủ tài khoản</label>
                <input
                  type="text"
                  required
                  placeholder="Viết hoa không dấu. VD: NGUYEN VAN PHU"
                  value={bankOwnerName}
                  onChange={(e) => setBankOwnerName(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-950 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm font-bold uppercase"
                />
                <p className="text-[10px] text-gray-400 mt-1">Cần nhập chính xác tên để tạo mã QR ngân hàng chuẩn xác.</p>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 shadow-sm transition-colors mt-2"
              >
                Lưu cài đặt nhận tiền
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: VIETQR PAY DEBT LIGHTBOX (XÁC NHẬN 2 BƯỚC) ───── */}
      {activePayDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-gray-200 text-center space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900">⚡ Quét mã VietQR chuyển khoản</h3>
              <button onClick={() => setActivePayDebt(null)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">×</button>
            </div>

            {!activeCreditorProfile?.bank_account ? (
              <div className="py-6 text-center space-y-2">
                <span className="text-4xl">⚠️</span>
                <p className="text-sm font-bold text-gray-800">{activePayDebt.creditorName} chưa cấu hình STK!</p>
                <p className="text-xs text-gray-400 px-4">Hãy bảo {activePayDebt.creditorName} nhấn nút **"Cài đặt nhận tiền VietQR"** ở góc trên màn hình để điền STK nhé.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-gray-500">
                  Trả <span className="font-bold text-emerald-700">{activePayDebt.amount.toLocaleString("vi-VN")}đ</span> cho <span className="font-bold text-gray-900">{activePayDebt.creditorName}</span>
                </p>

                {/* QR Image */}
                {qrCodeUrl && (
                  <div className="border border-gray-100 rounded-2xl p-3 bg-white shadow-sm inline-block mx-auto">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrCodeUrl} alt="VietQR Code" className="w-48 h-48 mx-auto" />
                  </div>
                )}

                <div className="bg-gray-50 rounded-xl p-3 text-xs text-left space-y-1.5 border border-gray-200/60 font-semibold">
                  <p className="text-gray-400">Thông tin chuyển khoản:</p>
                  <p className="text-gray-800">Ngân hàng: <span className="text-emerald-700 uppercase">{activeCreditorProfile.bank_id}</span></p>
                  <p className="text-gray-800">STK: <span className="text-gray-950 font-bold">{activeCreditorProfile.bank_account}</span></p>
                  <p className="text-gray-800">Chủ TK: <span className="text-gray-950 font-bold uppercase">{activeCreditorProfile.bank_owner_name}</span></p>
                  <p className="text-gray-800">Số tiền: <span className="text-rose-600 font-extrabold">{activePayDebt.amount.toLocaleString("vi-VN")}đ</span></p>
                </div>

                <button
                  onClick={handleReportPaid}
                  className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 shadow-sm transition-colors"
                >
                  Tôi đã chuyển khoản thành công
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: ADD CUSTOM ITEM TO CATALOG ────────────────── */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-gray-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-gray-900">＋ Thêm đồ mới vào kho phòng</h3>
              <button onClick={() => setShowCatalogModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleAddCatalogItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase">Tên đồ dùng</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Giấy vệ sinh, Nước rửa chén..."
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-950 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase">Giá mặc định (đ)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="Ví dụ: 30000"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-950 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase">Biểu tượng Emoji</label>
                  <select
                    value={newItemEmoji}
                    onChange={(e) => setNewItemEmoji(e.target.value)}
                    className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-950 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                  >
                    <option value="📦">📦 Hộp/Đồ dùng</option>
                    <option value="🧴">🧴 Chai gội/Xả</option>
                    <option value="🧼">🧼 Xà bông/Rửa chén</option>
                    <option value="🍾">🍾 Chai gia vị/Mắm</option>
                    <option value="🥃">🥃 Chai dầu ăn</option>
                    <option value="💧">💧 Nước uống</option>
                    <option value="🧺">🧺 Giặt là</option>
                    <option value="🥬">🥬 Rau củ quả</option>
                    <option value="🥚">🥚 Trứng/Thực phẩm</option>
                    <option value="🚽">🚽 Giấy vệ sinh</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 shadow-sm transition-colors mt-2"
              >
                Lưu vào kho đồ phòng
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── LIGHTBOX: VIEW BILL PHOTO ATTACHMENT ─────────────── */}
      {selectedBillPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onClick={() => setSelectedBillPhoto(null)}>
          <div className="relative max-w-2xl max-h-[85vh] overflow-auto bg-white rounded-2xl p-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedBillPhoto(null)}
              className="absolute top-4 right-4 bg-black/60 text-white rounded-full h-8 w-8 flex items-center justify-center font-bold text-lg hover:bg-black"
            >
              ×
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedBillPhoto}
              alt="Hóa đơn phòng đính kèm"
              className="max-w-full h-auto rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}



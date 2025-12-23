"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Printer, Calendar, Save, TrendingUp, TrendingDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomerSelect } from "@/components/CustomerSelect";

// Mock Data for Collections
const initialCollections: any[] = [];

// Mock Data for Expenses
const initialExpenses: any[] = [];

export default function GunlukKasaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [collections, setCollections] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [previousBalance, setPreviousBalance] = useState(0);
  const [todayPaidWages, setTodayPaidWages] = useState(0);
  const [totalWageDebt, setTotalWageDebt] = useState(0);
  const [loading, setLoading] = useState(false);

  // Enum Mapping Helpers
  const mapPaymentMethodToDb = (uiValue: string) => {
    const map: Record<string, string> = {
      'Nakit': 'nakit',
      'Kredi Kartı': 'kredi_karti',
      'Havale': 'havale',
      'EFT': 'havale',
      'Havale / EFT': 'havale'
    };
    return map[uiValue] || uiValue.toLowerCase();
  };

  const mapPaymentMethodFromDb = (dbValue: string) => {
    const map: Record<string, string> = {
      'nakit': 'Nakit',
      'cash': 'Nakit',
      'kredi_karti': 'Kredi Kartı',
      'credit_card': 'Kredi Kartı',
      'kart': 'Kredi Kartı', // Support 'kart'
      'havale': 'Havale',
      'bank_transfer': 'Havale',
      'eft': 'Havale'
    };
    return map[dbValue] || dbValue;
  };

  // Fetch Data
  const loadData = async () => {
    setLoading(true);
    try {
      const { getDailyTransactions } = await import("@/lib/supabaseQueries");
      const data = await getDailyTransactions(selectedDate);

      setPreviousBalance(data.previousBalance);
      setTodayPaidWages(data.todayPaidWages);
      setTotalWageDebt(data.totalWageDebt);

      // Map incoming data for UI display
      setCollections(data.collections.map((c: any) => ({
        ...c,
        payment_method: mapPaymentMethodFromDb(c.payment_method),
        type: mapPaymentMethodFromDb(c.payment_method) // Ensure type matches for filtering
      })));

      setExpenses(data.expenses.map((e: any) => ({
        ...e,
        method: mapPaymentMethodFromDb(e.method)
      })));

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  // Calculate totals
  const totalCollection = collections
    .filter(item => item.payment_method === "Nakit")
    .reduce((sum, item) => sum + (item.amount || 0), 0);

  const totalExpense = expenses
    .filter(item => item.method === "Nakit")
    .reduce((sum, item) => sum + (item.amount || 0), 0);

  // Handlers
  const handleSaveCollection = async (item: any, isNew: boolean, inputValues: any) => {
    try {
      const { createCollection, updateCollection } = await import("@/lib/supabaseQueries");

      const payload = {
        date: selectedDate, // Always use selected date for consistency
        amount: parseFloat(inputValues.amount),
        customer_id: inputValues.customer?.id, // If new
        payment_method: mapPaymentMethodToDb(inputValues.customer?.payment_method || 'Nakit'), // Default or from input
        description: 'Günlük Kasa Tahsilat'
      };

      if (!payload.customer_id && isNew) {
        alert("Lütfen müşteri seçiniz");
        return;
      }

      if (isNew) {
        await createCollection(payload);
      } else {
        await updateCollection(item.id, { amount: payload.amount }); // Only update amount for now
      }
      loadData();
    } catch (e: any) {
      console.error(e);
      alert(`Kayıt başarısız: ${e.message || 'Bilinmeyen hata'}`);
    }
  };

  const handleDeleteCollection = async (id: string | number) => {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    try {
      const { deleteCollection } = await import("@/lib/supabaseQueries");
      await deleteCollection(id);
      loadData();
    } catch (e) {
      console.error(e);
      alert("Silme başarısız");
    }
  }

  const handleSaveExpense = async (item: any, isNew: boolean, inputValues: any) => {
    try {
      const { createExpense, updateExpense } = await import("@/lib/supabaseQueries");

      const mapExpenseMethodToDb = (uiValue: string) => {
        const map: Record<string, string> = {
          'Nakit': 'nakit',
          'Kredi Kartı': 'kart', // User specified 'kart' for expenses
          'Havale': 'havale',
          'EFT': 'havale'
        };
        return map[uiValue] || uiValue.toLowerCase();
      };

      const payload = {
        date: selectedDate,
        description: inputValues.detail,
        receipt_no: inputValues.receiptNo,
        amount: parseFloat(inputValues.amount),
        payment_method: mapExpenseMethodToDb(inputValues.method || 'Nakit'),
        category: 'Genel'
      };

      if (isNew) {
        await createExpense(payload);
      } else {
        await updateExpense(item.id, payload);
      }
      loadData();
    } catch (e: any) {
      console.error(e);
      alert(`İşlem Başarısız: ${e.message || 'Bilinmeyen hata'}`);
    }
  }

  const handleDeleteExpense = async (id: string | number) => {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    try {
      const { deleteExpense } = await import("@/lib/supabaseQueries");
      await deleteExpense(id);
      loadData();
    } catch (e) {
      console.error(e);
      alert("Silme başarısız");
    }
  }


  // Generate empty rows to fill the UI (keep at least 15 rows visible) - RESTORED TO 15
  const collectionRows = Array.from({ length: Math.max(0, 15 - collections.length) });
  const expenseRows = Array.from({ length: Math.max(0, 15 - expenses.length) });

  return (
    <>
      <Header title="Günlük Kasa" />
      <div className="p-8 space-y-6">

        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Günlük Kasa</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2 py-1.5 text-sm font-bold text-slate-700 bg-slate-50 rounded border border-slate-200 hover:bg-slate-100 outline-none"
              />
              <button
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded"
              >
                Bugün
              </button>
            </div>
            <button
              onClick={() => window.open(`/print/gunluk-kasa?date=${selectedDate}`, '_blank')}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <Printer className="h-4 w-4" />
              Yazdır
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Left Column: Tahsilatlar */}
          <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden h-full">
            <div className="bg-green-50 p-4 border-b border-green-100 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <h3 className="font-bold text-green-700">Günlük Müşteri Tahsilatları</h3>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-3 font-medium w-12 text-center">SIRA NO</th>
                    <th className="px-3 py-3 font-medium">MÜŞTERİ İSMİ</th>
                    <th className="px-3 py-3 font-medium">İŞİN YAPILDIĞI TARİH</th>
                    <th className="px-3 py-3 font-medium text-right">TAHSİLAT MİKTARI</th>
                    <th className="px-3 py-3 font-medium text-center w-24">İŞLEM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Existing Collections */}
                  {collections.map((item, index) => (
                    <CollectionRow
                      key={item.id}
                      index={index}
                      item={item}
                      onSave={(vals: any) => handleSaveCollection(item, false, vals)}
                      onDelete={() => handleDeleteCollection(item.id)}
                    />
                  ))}

                  {/* Empty Rows for Adding */}
                  {collectionRows.map((_, i) => (
                    <CollectionRow
                      key={`new-${i}-${collections.length}`}
                      index={collections.length + i}
                      isNew
                      defaultDate={selectedDate}
                      onSave={(vals: any) => handleSaveCollection(null, true, vals)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Summary - Left - RESTORED */}
            <div className="bg-slate-50 p-6 border-t border-slate-200 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-700">BUGÜN TAHSİLAT TOPLAMI</span>
                <span className="font-bold text-green-600">
                  ₺{totalCollection.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-700">BUGÜN ÖDENEN YÖMİYELER TOPLAMI</span>
                <span className="font-bold text-slate-900">₺{todayPaidWages.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-700">TOPLAM YEVMİYE BORCU</span>
                <span className="font-bold text-red-600">₺{totalWageDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-700">DÜNDEN KASA DEVRİ</span>
                <span className="font-bold text-slate-900">₺{previousBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="font-black text-slate-800 text-lg">BUGÜN KASA TOPLAMI</span>
                <span className="font-black text-blue-600 text-lg">
                  ₺{(previousBalance + totalCollection - totalExpense - todayPaidWages).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Harcamalar */}
          <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden h-full">
            <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <h3 className="font-bold text-red-700">Günlük Genel Harcamalar</h3>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-3 font-medium w-12 text-center">SIRA NO</th>
                    <th className="px-3 py-3 font-medium">HARCAMA DETAYI</th>
                    <th className="px-3 py-3 font-medium">TARİHİ VE FİŞ NO</th>
                    <th className="px-3 py-3 font-medium text-right">HARCAMA TUTARI</th>
                    <th className="px-3 py-3 font-medium">ÖDEME YÖNTEMİ</th>
                    <th className="px-3 py-3 font-medium text-center w-24">İŞLEM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Existing Expenses */}
                  {expenses.map((item, index) => (
                    <ExpenseRow
                      key={item.id}
                      index={index}
                      item={item}
                      onSave={(vals: any) => handleSaveExpense(item, false, vals)}
                      onDelete={() => handleDeleteExpense(item.id)}
                    />
                  ))}

                  {/* Empty Expense Rows */}
                  {expenseRows.map((_, i) => (
                    <ExpenseRow
                      key={`new-exp-${i}-${expenses.length}`}
                      index={expenses.length + i}
                      isNew
                      onSave={(vals: any) => handleSaveExpense(null, true, vals)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Summary - Right - RESTORED */}
            <div className="bg-slate-50 p-6 border-t border-slate-200 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-700">BUGÜN ÖDENEN GİDERLER TOPLAMI</span>
                <span className="font-bold text-red-600">
                  ₺{totalExpense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-700">BUGÜN İTİBARİYLE TOPLAM YEVMİYE BORCU</span>
                <span className="font-bold text-slate-900">₺0,00</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-700">BUGÜN ÖDENEN YÖMİYE TOPLAMI</span>
                <span className="font-bold text-slate-900">₺0,00</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </>
  );
}

// --- Helper Components for Rows (To handle internal state) ---
import { Trash2 } from "lucide-react";

function CollectionRow({ index, item, isNew, defaultDate, onSave, onDelete }: any) {
  const [customer, setCustomer] = useState(item?.customer ? { name: item.customer } : null); // Mock obj if existing
  const [amount, setAmount] = useState(item?.amount || '');
  // Date is purely visual/fixed in this context or editable? Existing code showed editable. 
  // New logic: For existing items, it's just display usually, but let's keep it 'input' style to match UI.

  return (
    <tr className="hover:bg-slate-50/50">
      <td className="px-3 py-2 text-center text-slate-500 font-medium">{index + 1}</td>
      <td className="px-3 py-2 text-slate-900 font-bold">
        {isNew ? (
          <CustomerSelect onSelect={setCustomer} />
        ) : (
          item.customer
        )}
      </td>
      <td className="px-3 py-2">
        <div className="w-full rounded border border-slate-200 py-1.5 px-2 text-center text-xs bg-slate-50 text-slate-500 font-medium">
          {new Date(item?.date || defaultDate).toLocaleDateString("tr-TR")}
        </div>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-l border border-r-0 border-slate-200 py-1.5 px-2 text-right text-xs outline-none focus:border-green-500 font-bold"
            placeholder="0"
          />
          <div className="border border-l-0 border-slate-200 bg-slate-50 px-2 py-1.5 rounded-r">
            <span className="text-xs text-slate-500">₺</span>
          </div>
        </div>
      </td>
      <td className="px-3 py-2 text-center">
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => onSave({ customer, amount })}
            className="rounded bg-green-500 p-1.5 text-white hover:bg-green-600 transition-colors shadow-sm shadow-green-200">
            <Save className="h-3 w-3" />
          </button>
          {!isNew && (
            <button
              onClick={onDelete}
              className="rounded bg-red-100 p-1.5 text-red-600 hover:bg-red-200 transition-colors">
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function ExpenseRow({ index, item, isNew, onSave, onDelete }: any) {
  const [detail, setDetail] = useState(item?.detail || '');
  const [receiptNo, setReceiptNo] = useState(item?.receiptNo || '');
  const [amount, setAmount] = useState(item?.amount || '');
  const [method, setMethod] = useState(item?.method || 'Nakit');

  return (
    <tr className="hover:bg-slate-50/50">
      <td className="px-3 py-2 text-center text-slate-500 font-medium">{index + 1}</td>
      <td className="px-3 py-2">
        <input
          type="text"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder={isNew ? "Harcama..." : ""}
          className="w-full rounded border border-slate-200 py-1.5 px-2 text-xs outline-none focus:border-red-500"
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          value={receiptNo}
          onChange={(e) => setReceiptNo(e.target.value)}
          placeholder={isNew ? "Fiş No..." : ""}
          className="w-full rounded border border-slate-200 py-1.5 px-2 text-xs outline-none focus:border-red-500"
        />
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-l border border-r-0 border-slate-200 py-1.5 px-2 text-right text-xs outline-none focus:border-red-500 font-bold"
            placeholder="0"
          />
          <div className="border border-l-0 border-slate-200 bg-slate-50 px-2 py-1.5 rounded-r">
            <span className="text-xs text-slate-500">₺</span>
          </div>
        </div>
      </td>
      <td className="px-3 py-2">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="w-full rounded border border-slate-200 py-1.5 px-1 text-xs outline-none focus:border-red-500 bg-white">
          <option>Nakit</option>
          <option>Kredi Kartı</option>
          <option>Havale</option>
        </select>
      </td>
      <td className="px-3 py-2 text-center">
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => onSave({ detail, receiptNo, amount, method })}
            className="rounded bg-red-500 p-1.5 text-white hover:bg-red-600 transition-colors shadow-sm shadow-red-200">
            <Save className="h-3 w-3" />
          </button>
          {!isNew && (
            <button
              onClick={onDelete}
              className="rounded bg-red-100 p-1.5 text-red-600 hover:bg-red-200 transition-colors">
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}


import { createClient } from '@/utils/supabase/client';
export const supabase = createClient();

// Helper: Retry operation
async function fetchWithRetry<T>(operation: () => Promise<T>, retries = 3, delay = 500): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(operation, retries - 1, delay * 2);
        }
        throw error;
    }
}

// Interfaces
export interface PersonnelRow {
    id: string
    full_name: string
    role: string | null
    status: string | null
    current_balance: number | null
}

export interface PayrollRow {
    id: string
    personnel_id: string
    daily_wage: number | null
    paid_amount: number | null
    description: string | null
}

export interface WorkOrderRow {
    id: string
    date: string
    description: string | null
    address: string | null
    price: number | null
    work_order_assignments: { personnel_id: string | null, personnel: { id: string, full_name: string } | null }[] | null
    customers: { id: string, name: string } | null
}

export interface DailyPersonnelComputed {
    personnel: PersonnelRow
    carryover: number
    daily_wage: number
    paid_amount: number
    balance_after: number
    work_orders: WorkOrderRow[]
    // Legacy fields for UI compatibility
    id: string
    name: string
    phone: string | null
    job: string
    devir: number
    hakedis: number
    odenen: number
    bakiye: number
    recordId: string | undefined
}

export interface DashboardStats {
    totalIncome: number
    totalExpense: number
    totalWorkAmount: number
    pendingCollection: number
    netProfit: number
}

// --- Dashboard Specific ---

export const getDashboardStats = async (): Promise<{ data?: DashboardStats; errors?: any }> => {

    const [collectionsRes, expensesRes, workOrdersRes] = await Promise.allSettled([
        supabase.from('collections').select('amount, date'),
        supabase.from('expenses').select('amount, date'),
        supabase.from('work_orders').select('price, date, status'),
    ]);

    const collections = collectionsRes.status === 'fulfilled' && !collectionsRes.value.error
        ? (collectionsRes.value.data as { amount: number | null, date: string }[])
        : [];

    const expenses = expensesRes.status === 'fulfilled' && !expensesRes.value.error
        ? (expensesRes.value.data as { amount: number | null, date: string }[])
        : [];

    const workOrders = workOrdersRes.status === 'fulfilled' && !workOrdersRes.value.error
        ? (workOrdersRes.value.data as { price: number | null, date: string, status: string }[])
        : [];

    // Date Filters
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Start of month: 1st day of current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    // End of month: Last day of current month (day 0 of next month)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // Calculators
    const sum = (items: any[], key: string) => items.reduce((acc, item) => acc + (item[key] ?? 0), 0);

    // All Time (for Pending Collection)
    const allTimeIncome = sum(collections, 'amount');
    const totalWorkAmount = sum(workOrders, 'price');

    // Pending Collection: Sum of work orders strictly AFTER or ON today AND Approved
    const pendingCollection = workOrders
        .filter(w => w.date >= todayStr && w.status === 'onaylandı')
        .reduce((acc, w) => acc + (w.price ?? 0), 0);

    // Monthly (for UI)
    const monthlyIncome = collections
        .filter(c => c.date >= startOfMonth && c.date <= endOfMonth)
        .reduce((acc, c) => acc + (c.amount ?? 0), 0);

    const monthlyExpense = expenses
        .filter(e => e.date >= startOfMonth && e.date <= endOfMonth)
        .reduce((acc, e) => acc + (e.amount ?? 0), 0);

    const netProfit = monthlyIncome - monthlyExpense;

    // Mapping to existing interface but sending Monthly values
    const totalIncome = monthlyIncome;
    const totalExpense = monthlyExpense;

    const errors = {
        collections: collectionsRes.status === 'fulfilled' ? collectionsRes.value.error : collectionsRes.status === 'rejected' ? collectionsRes.reason : null,
        expenses: expensesRes.status === 'fulfilled' ? expensesRes.value.error : expensesRes.status === 'rejected' ? expensesRes.reason : null,
        work_orders: workOrdersRes.status === 'fulfilled' ? workOrdersRes.value.error : workOrdersRes.status === 'rejected' ? workOrdersRes.reason : null,
    };

    return {
        data: { totalIncome, totalExpense, totalWorkAmount, pendingCollection, netProfit },
        errors,
    };
};




// --- Schedule Specific ---

export interface UpcomingAssignment {
    personnel_id: string | null
    personnel: { id: string; full_name: string } | null
}

export interface UpcomingWork {
    date: string
    work_order_assignments: UpcomingAssignment[] | null
}

export interface UpcomingSchedule {
    // key: YYYY-MM-DD
    [day: string]: UpcomingWork[]
}

function formatDateYYYYMMDD(d: Date): string {
    return d.toISOString().slice(0, 10)
}

export async function getUpcomingSchedule(): Promise<{ data?: UpcomingSchedule; error?: any }> {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const plus10 = new Date(today)
    plus10.setUTCDate(today.getUTCDate() + 10)

    const todayISO = formatDateYYYYMMDD(today)
    const plus10ISO = formatDateYYYYMMDD(plus10)

    const res = await supabase
        .from('work_orders')
        .select('date,work_order_assignments(personnel_id,personnel(id,full_name))')
        .gte('date', todayISO)
        .lte('date', plus10ISO)
        .order('date', { ascending: true })

    if (res.error) return { error: res.error }

    const rows = (res.data ?? []) as unknown as UpcomingWork[]

    const schedule: UpcomingSchedule = {}

    for (const row of rows) {
        const day = (row.date || '').slice(0, 10) // YYYY-MM-DD
        if (!schedule[day]) schedule[day] = []
        schedule[day].push(row) // Push the job itself
    }

    return { data: schedule }
}

// Get full monthly schedule for Calendar Page
export async function getMonthlySchedule(year: number, month: number) {
    // Month is 0-indexed in JS Date, but lets blindly accept 1-12 or 0-11 logic. 
    // Standardizing: 1=Jan, 12=Dec based on common usage or 0-11 based on JS?
    // Let's assume input is 0-indexed (consistent with JS Date.getMonth()) for safety, 
    // or simple YYYY, MM. 

    // Calculate start and end of month
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0); // Last day of month

    const startISO = formatDateYYYYMMDD(startDate);
    const endISO = formatDateYYYYMMDD(endDate);

    const { data, error } = await supabase
        .from('work_orders')
        .select(`
      id,
      date,
      description,
      address,
      price,
      status,
      customers (
        name
      ),
      work_order_assignments (
        personnel_id,
        personnel (
          id,
          full_name,
          role,
          phone
        )
      )
    `)
        .gte('date', startISO)
        .lte('date', endISO);

    if (error) throw error;
    if (!data) return {};

    const schedule: Record<string, any[]> = {};

    data.forEach((wo: any) => {
        // Ensure date matches YYYY-MM-DD format regardless of it being timestamp or date
        const dateKey = (wo.date || '').slice(0, 10);
        if (!schedule[dateKey]) schedule[dateKey] = [];

        // Format for FE consumption (matching CalendarJobModal expectations)
        const formattedJob = {
            id: wo.id,
            customer: wo.customers?.name || 'Bilinmeyen Müşteri',
            status: wo.status === 'onaylandı' ? 'Onaylandı' : (wo.status === 'onaylanmadı' ? 'Onay Bekliyor' : wo.status),
            description: wo.description,
            address: wo.address,
            amount: wo.price ? `₺${wo.price.toLocaleString('tr-TR')}` : '₺0',
            staffCount: wo.work_order_assignments?.length || 0,
            assignedStaff: wo.work_order_assignments?.map((a: any) => ({
                name: a.personnel?.full_name || 'Silinmiş Personel',
                role: a.personnel?.role || '-',
                phone: a.personnel?.phone || '-'
            })) || []
        };

        schedule[dateKey].push(formattedJob);
    });

    return schedule;
}


// --- General Access + Search ---


export const getCustomers = async (
    page: number = 1,
    pageSize: number = 20,
    search: string = '',
    type: string | null = null
) => {
    let query = supabase
        .from('customers')
        .select('*', { count: 'exact' });

    if (search) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    if (type && type !== 'Tümü') {
        query = query.eq('type', type);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
        .order('name')
        .range(from, to);

    if (error) throw error;
    return { data, count };
};

// 3. Create Customer
export const createCustomer = async (customer: any) => {
    // customer.addresses should be string[]
    const { data, error } = await supabase
        .from('customers')
        .insert([{
            name: customer.name,
            type: customer.type,
            phone: customer.phone,
            tax_id: customer.taxId,
            address_json: customer.addresses, // Now sending array to JSONB column
            description: customer.description
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

// 4. Delete Customer
export const deleteCustomer = async (id: string | number) => {
    // 1. Delete Collections
    const { error: colError } = await supabase
        .from('collections')
        .delete()
        .eq('customer_id', id);

    if (colError) {
        console.error("Error deleting customer collections:", colError);
        throw colError;
    }

    // 2. Delete Work Orders (and their assignments)
    // First, find work orders to delete their assignments
    const { data: workOrders } = await supabase
        .from('work_orders')
        .select('id')
        .eq('customer_id', id);

    if (workOrders && workOrders.length > 0) {
        const workOrderIds = workOrders.map(w => w.id);

        // Delete assignments for these work orders
        const { error: assignError } = await supabase
            .from('work_order_assignments')
            .delete()
            .in('work_order_id', workOrderIds);

        if (assignError) {
            console.error("Error deleting customer WO assignments:", assignError);
            throw assignError;
        }

        // Delete work orders
        const { error: woError } = await supabase
            .from('work_orders')
            .delete()
            .in('id', workOrderIds);

        if (woError) {
            console.error("Error deleting customer work orders:", woError);
            throw woError;
        }
    }

    // 3. Delete Customer
    const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
};

export const deleteWorkOrder = async (id: string | number) => {
    // 1. Delete assignments
    const { error: assignError } = await supabase
        .from('work_order_assignments')
        .delete()
        .eq('work_order_id', id);

    if (assignError) {
        console.error("Error deleting work order assignments:", assignError);
        throw assignError;
    }

    // 2. Delete work order
    const { error } = await supabase
        .from('work_orders')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
};

// 5. Update Customer
export const updateCustomer = async (id: string | number, updates: any) => {
    const { data, error } = await supabase
        .from('customers')
        .update({
            name: updates.name,
            type: updates.type,
            phone: updates.phone,
            tax_id: updates.taxId,
            address_json: updates.addresses, // Now sending array to JSONB column
            description: updates.description
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};


export const searchGeneral = async (query: string, dateRange?: { start: string, end: string }) => {
    if (!query && !dateRange) return [];

    let results: any[] = [];

    // 1. Search Customers (Only if query is present, date filtering on customers is 'created_at' which might not be what user wants, but we'll include it)
    if (query) {
        let q = supabase
            .from('customers')
            .select('*')
            .or(`name.ilike.%${query}%,phone.ilike.%${query}%`);

        if (dateRange) {
            q = q.gte('created_at', dateRange.start).lte('created_at', dateRange.end);
        }

        const { data: customers } = await q;

        if (customers) {
            results.push(...customers.map(c => {
                // Handle address display (it might be array now)
                let addressDisplay = '-';
                let addressesArray = c.address_json || c.address || [];
                if (!Array.isArray(addressesArray)) {
                    addressesArray = [String(addressesArray)];
                }

                if (addressesArray.length > 0) {
                    const first = addressesArray[0];
                    const firstStr = (typeof first === 'object' && first !== null) ? (first.address || JSON.stringify(first)) : String(first);
                    addressDisplay = firstStr + (addressesArray.length > 1 ? ` (+${addressesArray.length - 1} diğer)` : '');
                }

                return {
                    id: c.id,
                    source: 'Müşteri',
                    name: c.name,
                    description: `Telefon: ${c.phone || '-'} | Adres: ${addressDisplay}`,
                    date: c.created_at ? new Date(c.created_at).toLocaleDateString('tr-TR') : '-',
                    amount: '-',
                    extraInfo: `Tip: ${c.type || 'Normal'} | Bakiye: ₺${c.current_balance || 0}`
                };
            }));
        }
    }

    // 2. Search Work Orders
    let woQuery = supabase
        .from('work_orders')
        .select('*, customers(name)');

    if (query) {
        woQuery = woQuery.ilike('description', `%${query}%`);
    }

    if (dateRange) {
        woQuery = woQuery.gte('date', dateRange.start).lte('date', dateRange.end);
    } else {
        if (!query) return [];
    }

    const { data: workOrders } = await woQuery.limit(50);

    if (workOrders) {
        results.push(...workOrders.map(w => ({
            id: w.id,
            source: 'İş Emri',
            name: w.customers?.name || 'Bilinmeyen Müşteri',
            description: w.description || 'Açıklama Yok',
            date: new Date(w.date).toLocaleDateString('tr-TR'),
            amount: `₺${w.price || 0}`, // Fixed: amount -> price
            extraInfo: `Durum: ${w.status === 'onaylandı' ? 'Onaylandı' : (w.status === 'onaylanmadı' ? 'Bekliyor' : w.status)}`
        })));
    }

    // 3. Search Collections
    let colQuery = supabase
        .from('collections')
        .select('*, customers(name)');

    if (query) {
        colQuery = colQuery.ilike('description', `%${query}%`);
    }

    if (dateRange) {
        colQuery = colQuery.gte('date', dateRange.start).lte('date', dateRange.end);
    }

    // Safety check just in case
    if (!query && !dateRange) return [];

    const { data: collections } = await colQuery.limit(50);

    if (collections) {
        results.push(...collections.map(c => ({
            id: c.id,
            source: 'Tahsilat',
            name: c.customers?.name || 'Bilinmeyen Müşteri',
            description: c.description || 'Tahsilat',
            date: new Date(c.date).toLocaleDateString('tr-TR'),
            amount: `₺${c.amount || 0}`,
            extraInfo: `Yöntem: ${c.payment_method || '-'}`
        })));
    }

    // 4. Search Personnel
    if (query) {
        // Only search personnel if there is a text query (searching by date doesn't make much sense for a "person", maybe for logs but we don't have logs here)
        const { data: personnel } = await supabase
            .from('personnel')
            .select('*')
            .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%,role.ilike.%${query}%`)
            .limit(20);

        if (personnel) {
            results.push(...personnel.map(p => ({
                id: p.id,
                source: 'Personel',
                name: p.full_name,
                description: `Rol: ${p.role || '-'} | Telefon: ${p.phone || '-'}`,
                date: '-',
                amount: `Bakiye: ₺${p.current_balance || 0}`,
                extraInfo: `Durum: ${p.status || '-'}`
            })));
        }
    }

    // 5. Search Expenses
    let expQuery = supabase.from('expenses').select('*');
    if (query) {
        expQuery = expQuery.ilike('description', `%${query}%`);
    }
    if (dateRange) {
        expQuery = expQuery.gte('date', dateRange.start).lte('date', dateRange.end);
    }

    // Only fetch expenses if we have a criteria
    if (query || dateRange) {
        const { data: expenses } = await expQuery.limit(50);
        if (expenses) {
            results.push(...expenses.map(e => ({
                id: e.id,
                source: 'Gider',
                name: 'Gider Kaydı',
                description: e.description || 'Açıklama Yok',
                date: new Date(e.date).toLocaleDateString('tr-TR'),
                amount: `₺${e.amount || 0}`,
                extraInfo: `Kategori: ${e.category || '-'}`
            })));
        }
    }

    return results;
};


// --- Reporting & Analysis ---

export const getReportingStats = async (period: '6months' | 'year' | 'lastyear' = 'year') => {
    // Determine date range
    const now = new Date();
    let startDate = new Date();

    if (period === '6months') {
        startDate.setMonth(now.getMonth() - 6);
    } else if (period === 'year') {
        startDate = new Date(now.getFullYear(), 0, 1);
    } else {
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        now.setFullYear(now.getFullYear() - 1);
        now.setMonth(11);
        now.setDate(31);
    }

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = now.toISOString().split('T')[0];

    try {
        // 1. Fetch Income (Collections)
        const { data: incomeData } = await supabase
            .from('collections')
            .select('amount, date')
            .gte('date', startStr)
            .lte('date', endStr);

        // 2. Fetch Expense (Expenses)
        const { data: expenseData } = await supabase
            .from('expenses')
            .select('amount, date')
            .gte('date', startStr)
            .lte('date', endStr);

        // 3. Fetch Work Orders for "Jobs Count"
        const { data: jobsData } = await supabase
            .from('work_orders')
            .select('id, date')
            .gte('date', startStr)
            .lte('date', endStr);

        // Process Monthly Data for Charts
        const monthlyStats: Record<string, { month: string, gelir: number, gider: number, kar: number }> = {};

        // Helper to get month key "YYYY-MM"
        const getMonthKey = (date: string) => date.substring(0, 7);

        incomeData?.forEach(item => {
            const key = getMonthKey(item.date);
            if (!monthlyStats[key]) monthlyStats[key] = { month: key, gelir: 0, gider: 0, kar: 0 };
            monthlyStats[key].gelir += item.amount;
        });

        expenseData?.forEach(item => {
            const key = getMonthKey(item.date);
            if (!monthlyStats[key]) monthlyStats[key] = { month: key, gelir: 0, gider: 0, kar: 0 };
            monthlyStats[key].gider += item.amount;
        });

        // Calculate Profit
        Object.values(monthlyStats).forEach(stat => {
            stat.kar = stat.gelir - stat.gider;
        });

        const trendData = Object.values(monthlyStats)
            .sort((a, b) => a.month.localeCompare(b.month))
            .map(item => ({
                name: new Date(item.month + '-01').toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' }),
                gelir: item.gelir,
                gider: item.gider,
                kar: item.kar
            }));

        // Calculate Summary Cards (This Month vs Previous Month?)
        // For simplicity, let's just use "This Month" values from the stats we already have
        // But the user might be looking at "All Year", so the cards usually show "This Month" context or "Selected Period Total"? 
        // The UI says "Bu Ay Gelir" (This Month Income), so we should calculate specifically for current month regardless of selected filter,
        // OR the UI implies "Bu Ay" means the last month of the selected period?
        // Let's stick to "Current Calendar Month" for the cards as the labels explicitly say "Bu Ay".

        const currentMonthKey = getMonthKey(new Date().toISOString());
        const thisMonthStats = monthlyStats[currentMonthKey] || { gelir: 0, gider: 0, kar: 0 };

        // Count jobs for this month
        const thisMonthJobs = jobsData?.filter(j => getMonthKey(j.date) === currentMonthKey).length || 0;

        return {
            trendData,
            profitData: trendData.map(t => ({ name: t.name, kar: t.kar })),
            summary: {
                income: thisMonthStats.gelir,
                expense: thisMonthStats.gider,
                profit: thisMonthStats.kar,
                jobs: thisMonthJobs
            }
        };

    } catch (error) {
        console.error('Report stats error:', error);
        return { trendData: [], profitData: [], summary: { income: 0, expense: 0, profit: 0, jobs: 0 } };
    }
};

export const getCustomerPerformanceStats = async () => {
    try {
        const { data: customers } = await supabase.from('customers').select('id, name');

        if (!customers) return [];

        const { data: collections } = await supabase.from('collections').select('customer_id, amount');
        const { data: workOrders } = await supabase.from('work_orders').select('customer_id, amount, status');

        // Aggregate
        const report = customers.map(c => {
            const customerCollections = collections?.filter(col => col.customer_id === c.id) || [];
            const customerOrders = workOrders?.filter(wo => wo.customer_id === c.id) || [];

            const billed = customerOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
            const collected = customerCollections.reduce((sum, col) => sum + (col.amount || 0), 0);
            const pending = Math.max(0, billed - collected);
            const jobs = customerOrders.length;
            const rate = billed > 0 ? (collected / billed) * 100 : 0;

            return {
                id: c.id,
                name: c.name,
                billed,
                collected,
                pending,
                jobs,
                rate
            };
        });

        return report.sort((a, b) => b.billed - a.billed).slice(0, 30); // Return top 30 by volume

    } catch (error) {
        console.error('Customer performance error:', error);
        return [];
    }
};

// --- Paginated List Functions ---

// --- Personnel Specific ---

export const createPersonnel = async (personnel: any) => {
    const { data, error } = await supabase
        .from('personnel')
        .insert([{
            full_name: personnel.name,
            phone: personnel.phone,
            tc_no: personnel.tc,
            status: personnel.status,
            role: 'Personel' // Default role
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};


// 1. Personnel Pagination
export const getPersonnel = async (
    page: number = 1,
    pageSize: number = 20,
    search: string = ''
) => {
    let query = supabase
        .from('personnel')
        .select('*', { count: 'exact' });

    if (search) {
        query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
        .order('full_name')
        .range(from, to);

    if (error) throw error;
    return { data, count };
};

// 2. Work Orders Pagination
export const getWorkOrders = async (
    page: number = 1,
    pageSize: number = 20,
    search: string = '',
    date: string | null = null
) => {
    let query = supabase
        .from('work_orders')
        .select(`
            *,
            customers (
                id,
                name,
                phone
            ),
            work_order_assignments (
                personnel_id,
                personnel (
                    id,
                    full_name
                )
            )
        `, { count: 'exact' });

    if (date) {
        query = query.eq('date', date);
    }

    if (search) {
        query = query.ilike('description', `%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
        .order('date', { ascending: false })
        .range(from, to);

    if (error) throw error;

    // Map for UI and Edit Modal
    const mapped = data?.map((d: any) => {
        const assignments = d.work_order_assignments || [];
        const staffIds = assignments.map((a: any) => a.personnel_id);
        const staffNames = assignments.map((a: any) => a.personnel?.full_name).filter(Boolean);

        return {
            ...d,
            // UI Display fields
            customer: d.customers?.name || 'Bilinmiyor',
            customer_phone: d.customers?.phone || '',
            personnel: staffNames.length > 0 ? staffNames.join(", ") : 'Belirsiz',
            amount: d.price, // UI expects amount

            // Edit Modal fields
            customerObj: d.customers, // Pass full object for modal to use
            assigned_staff: staffIds, // Array of IDs for edit modal
        };
    });

    return { data: mapped, count };
};

// 3. Transactions (Income/Expense) Pagination
export const getTransactions = async (
    page: number = 1,
    pageSize: number = 20,
    filterType: 'thisMonth' | 'allTime' | 'custom' = 'thisMonth',
    dateRange: { start: string, end: string }
) => {
    let startStr = dateRange.start;
    let endStr = dateRange.end;

    if (filterType === 'thisMonth') {
        const now = new Date();
        startStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        endStr = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    } else if (filterType === 'allTime') {
        startStr = '2020-01-01';
        endStr = '2099-12-31';
    }

    // Fetch Income
    const { data: income } = await supabase
        .from('collections')
        .select('*')
        .gte('date', startStr)
        .lte('date', endStr)
        .order('date', { ascending: false })
        .limit(1000);

    // Fetch Expense
    const { data: expense } = await supabase
        .from('expenses')
        .select('*')
        .gte('date', startStr)
        .lte('date', endStr)
        .order('date', { ascending: false })
        .limit(1000);

    const combined = [
        ...(income || []).map(i => ({ ...i, type: 'income', category: 'Tahsilat' })),
        ...(expense || []).map(e => ({ ...e, type: 'expense', method: 'Nakit' }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // In-Memory Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize;

    return {
        data: combined.slice(from, to),
        count: combined.length
    };
};

// 4. Pending Collections Pagination
// 4. Pending Collections Pagination (Refactored for Correctness)
// 4. Pending Collections (Modified: Future Approved Work only)
export const getPendingCollectionsPaginated = async (
    page: number = 1,
    pageSize: number = 20,
    search: string = ''
) => {
    // Strategy:
    // User requested "Pending Collection" -> Should reflect "Net Balance" (Receivables).
    // Original Logic Scope: Customers with Future Approved Work.
    // New Logic: For those customers, calculate (Total Debt - Total Paid).

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Step 1: Get all future approved work orders to identify candidates
    const { data: futureWorkOrders } = await supabase
        .from('work_orders')
        .select('customer_id, date')
        .gte('date', todayStr) // Today and future
        .eq('status', 'onaylandı'); // Only approved assignments

    if (!futureWorkOrders || futureWorkOrders.length === 0) return { data: [], count: 0 };

    const relevantCustomerIds = Array.from(new Set(futureWorkOrders.map(wo => wo.customer_id).filter(Boolean)));

    if (relevantCustomerIds.length === 0) return { data: [], count: 0 };

    // Step 2: Calculate Balances for these customers
    // We need to fetch ALL history for these specific customers to get the true balance.
    // Optimization: Split huge lists if necessary, but assuming reasonable size.

    // 2a. Fetch All Work Orders (Debt) for these customers
    const { data: allWorkOrders } = await supabase
        .from('work_orders')
        .select('customer_id, price')
        .in('customer_id', relevantCustomerIds);

    // 2b. Fetch All Collections (Paid) for these customers
    const { data: allCollections } = await supabase
        .from('collections')
        .select('customer_id, amount')
        .in('customer_id', relevantCustomerIds);

    // 2c. Calculate Net Balance
    const balanceMap: Record<string, number> = {};
    const lastDateMap: Record<string, string> = {}; // Track nearest future date

    // Initialize
    relevantCustomerIds.forEach(id => {
        balanceMap[id] = 0;
        lastDateMap[id] = '9999-12-31';
    });

    // Sum Debt
    allWorkOrders?.forEach(wo => {
        if (balanceMap[wo.customer_id] !== undefined) {
            balanceMap[wo.customer_id] += (wo.price || 0);
        }
    });

    // Subtract Paid
    allCollections?.forEach(c => {
        if (balanceMap[c.customer_id] !== undefined) {
            balanceMap[c.customer_id] -= (c.amount || 0);
        }
    });

    // Find nearest future date
    futureWorkOrders.forEach(wo => {
        if (wo.customer_id && wo.date < lastDateMap[wo.customer_id]) {
            lastDateMap[wo.customer_id] = wo.date;
        }
    });

    // Step 3: Fetch Customer Details (with Search)
    let customerQuery = supabase
        .from('customers')
        .select('*')
        .in('id', relevantCustomerIds);

    if (search) {
        customerQuery = customerQuery.ilike('name', `%${search}%`);
    }

    const { data: customers } = await customerQuery;

    if (!customers) return { data: [], count: 0 };

    // Step 4: Map, Filter, Sort
    const finalResults = customers
        .map(c => {
            const balance = balanceMap[c.id] || 0;
            return {
                ...c,
                pending: balance,
                lastTransactionDate: lastDateMap[c.id]
            };
        })
        .filter(c => c.pending > 0) // Only show if they actually owe money
        .sort((a, b) => b.pending - a.pending); // Sort by highest debt

    // Step 5: Paginate
    const totalCount = finalResults.length;
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    const data = finalResults.slice(from, to);

    return {
        data,
        count: totalCount
    };
};

// --- CRM / AI Functionality ---

export const getCrmWhatsapp = async () => {
    const { data, error } = await supabase
        .from('crm_whatsapp')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error('Error fetching CRM data:', error);
        return [];
    }
    return data;
};

export const deleteCrmWhatsapp = async (id: number) => {
    const { error } = await supabase
        .from('crm_whatsapp')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// --- Detail Page Queries ---

export const getCustomerById = async (id: string) => {
    // 1. Customer Info
    const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;

    // 2. Transactions
    const { data: collections } = await supabase
        .from('collections')
        .select('*')
        .eq('customer_id', id);

    const { data: workOrders } = await supabase
        .from('work_orders')
        .select('*')
        .eq('customer_id', id);

    // Combine and sort
    const history = [
        ...(collections || []).map(c => ({
            id: c.id,
            type: 'collection',
            date: c.date,
            description: c.description || 'Tahsilat',
            amount: c.amount,
            isPlus: true // Tahsilat (collection) customer balance için alacak (ödeme yaptı) anlamına gelir
            // UI'da nasıl gösterildiğine göre değişir. 
            // Genelde Ekstre mantığı: Borç (İş Emri) - Alacak (Tahsilat)
        })),
        ...(workOrders || []).map(w => ({
            id: w.id,
            type: 'work_order',
            date: w.date,
            description: w.description || 'Hizmet Bedeli',
            amount: w.price,
            isPlus: false // Borçlanma
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate Balance Dynamically
    const totalDebt = (workOrders || []).reduce((acc, w) => acc + (w.price || 0), 0);
    const totalPaid = (collections || []).reduce((acc, c) => acc + (c.amount || 0), 0);
    const calculatedBalance = totalDebt - totalPaid;

    return { ...customer, history, current_balance: calculatedBalance };
};

export const getPersonnelById = async (id: string) => {
    // 1. Personnel Info
    const { data: personnel, error } = await supabase
        .from('personnel')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;

    // 2. Work History
    // 2. Work History
    // Fetch via relational table 'work_order_assignments'
    const { data: assignments, error: jobsError } = await supabase
        .from('work_order_assignments')
        .select(`
            id,
            work_order_id,
            work_orders (
                id,
                date,
                description,
                address,
                price
            )
        `)
        .eq('personnel_id', id)
        .order('created_at', { ascending: false }); // ordering by assignment creation roughly maps to date, or sort manually

    if (jobsError) console.error("Jobs fetch error:", jobsError);

    const personnelJobs = assignments?.map((a: any) => a.work_orders).filter(Boolean) || [];

    // Sort by date descending
    personnelJobs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 3. Payroll History
    const { data: payroll } = await supabase
        .from('payroll_records')
        .select('*')
        .eq('personnel_id', id)
        .order('date', { ascending: false });

    // Calculate Balance Dynamically
    const totalEarnings = (payroll || []).reduce((acc, p) => acc + (p.daily_wage || 0), 0);
    const totalPayments = (payroll || []).reduce((acc, p) => acc + (p.paid_amount || 0), 0);
    const calculatedBalance = totalEarnings - totalPayments;

    return { ...personnel, jobs: personnelJobs, payroll: payroll || [], current_balance: calculatedBalance };
};

export const getDailyPersonnelSummary = async (date: string, showBalanceOnly: boolean = false) => {

    // Parallel Fetching using Promise.allSettled
    const [
        personnelRes,
        todayPayrollRes,
        prevPayrollRes,
        workOrdersRes
    ] = await Promise.allSettled([
        supabase
            .from('personnel')
            .select('id,full_name,role,status,current_balance') // phone might be needed for UI, adding * would be safer or add phone to select
            .select('*') // Let's select * to be safe for UI props like phone
            .order('full_name', { ascending: true }),
        supabase
            .from('payroll_records')
            .select('id,personnel_id,daily_wage,paid_amount,description')
            .eq('date', date),
        supabase
            .from('payroll_records')
            .select('personnel_id,daily_wage,paid_amount')
            .lt('date', date),
        supabase
            .from('work_orders')
            .select('id,date,description,address,price,work_order_assignments(personnel_id,personnel(id,full_name)),customers(id,name)')
            .eq('date', date)
            .order('date', { ascending: false }),
    ]);

    // Data Extraction
    const personnel = personnelRes.status === 'fulfilled' && !personnelRes.value.error
        ? (personnelRes.value.data as any[])
        : [];

    const todayPayroll = todayPayrollRes.status === 'fulfilled' && !todayPayrollRes.value.error
        ? (todayPayrollRes.value.data as PayrollRow[])
        : [];

    const prevPayroll = prevPayrollRes.status === 'fulfilled' && !prevPayrollRes.value.error
        ? (prevPayrollRes.value.data as { personnel_id: string; daily_wage: number | null; paid_amount: number | null }[])
        : [];

    const workOrders = workOrdersRes.status === 'fulfilled' && !workOrdersRes.value.error
        ? (workOrdersRes.value.data as unknown as WorkOrderRow[])
        : [];

    // Devir (Carryover) Calculation
    const carryoverByPersonnel = new Map<string, number>();
    for (const row of prevPayroll) {
        const delta = (row.daily_wage ?? 0) - (row.paid_amount ?? 0);
        carryoverByPersonnel.set(
            row.personnel_id,
            (carryoverByPersonnel.get(row.personnel_id) ?? 0) + delta
        );
    }

    // Today's Totals (if multiple entries per person, though normally one)
    const todayByPersonnel = new Map<string, { daily_wage: number; paid_amount: number; recordId?: string }>();
    for (const row of todayPayroll) {
        const wage = row.daily_wage ?? 0;
        const paid = row.paid_amount ?? 0;
        const current = todayByPersonnel.get(row.personnel_id) ?? { daily_wage: 0, paid_amount: 0 };

        todayByPersonnel.set(row.personnel_id, {
            daily_wage: current.daily_wage + wage,
            paid_amount: current.paid_amount + paid,
            recordId: row.id // Just take last one if multiple
        });
    }

    // Index Work Orders by Personnel
    const workOrdersByPersonnel = new Map<string, WorkOrderRow[]>();
    for (const wo of workOrders) {
        const assignments = wo.work_order_assignments ?? [];
        for (const assn of assignments) {
            const pid = assn.personnel_id || assn.personnel?.id;
            if (!pid) continue;

            const list = workOrdersByPersonnel.get(pid) ?? [];
            list.push(wo);
            workOrdersByPersonnel.set(pid, list);
        }
    }

    // Merge & Compute
    let summary: DailyPersonnelComputed[] = personnel.map((p) => {
        const carryover = carryoverByPersonnel.get(p.id) ?? 0;
        const today = todayByPersonnel.get(p.id) ?? { daily_wage: 0, paid_amount: 0 };
        const balance_after = carryover + today.daily_wage - today.paid_amount;

        const assignedOrders = workOrdersByPersonnel.get(p.id) ?? [];
        const personJobs = assignedOrders.map(j => j.description).join(', ') || '-';
        const pName = p.full_name || p.name || 'İsimsiz';

        return {
            // New struct fields
            personnel: p,
            carryover,
            daily_wage: today.daily_wage,
            paid_amount: today.paid_amount,
            balance_after,
            work_orders: assignedOrders,

            // Legacy helpers for UI
            id: p.id,
            name: pName,
            phone: p.phone,
            job: personJobs,
            devir: carryover,
            hakedis: today.daily_wage,
            odenen: today.paid_amount,
            bakiye: balance_after,
            recordId: today.recordId
        };
    });

    // 5. Filter if requested
    if (showBalanceOnly) {
        summary = summary.filter(p => p.balance_after !== 0);
    }

    // 6. Sort
    summary.sort((a, b) => {
        const aWorking = a.job !== '-';
        const bWorking = b.job !== '-';
        if (aWorking && !bWorking) return -1;
        if (!aWorking && bWorking) return 1;

        const aHasBalance = a.bakiye !== 0;
        const bHasBalance = b.bakiye !== 0;
        if (aHasBalance && !bHasBalance) return -1;
        if (!aHasBalance && bHasBalance) return 1;

        return (a.name || "").localeCompare(b.name || "");
    });

    return summary;
};

// --- Mutations ---

export interface UpsertPayrollInput {
    personnel_id: string
    date: string // 'YYYY-MM-DD'
    daily_wage: number // 0 olabilir
    paid_amount: number // 0 olabilir
    description?: string | null
}

export async function upsertPayrollRecord(input: UpsertPayrollInput) {
    const { personnel_id, date, daily_wage, paid_amount, description = null } = input

    // 1) Var mı kontrolü
    const existing = await supabase
        .from('payroll_records')
        .select('id')
        .eq('personnel_id', personnel_id)
        .eq('date', date)
        .maybeSingle()

    if (existing.error && existing.error.code !== 'PGRST116') {
        // PGRST116: no rows found (maybeSingle özel durumu), bunu hata saymayacağız.
        return { error: existing.error }
    }

    let recordId: string | null = existing.data?.id ?? null

    // 2) Insert/Update
    if (!recordId) {
        const insertRes = await supabase
            .from('payroll_records')
            .insert([{
                personnel_id,
                date,
                daily_wage,
                paid_amount,
                description
            }])
            .select('id')
            .single()

        if (insertRes.error) {
            return { error: insertRes.error }
        }
        recordId = insertRes.data.id
    } else {
        const updateRes = await supabase
            .from('payroll_records')
            .update({
                daily_wage,
                paid_amount,
                description
            })
            .eq('id', recordId)
            .select('id')
            .single()

        if (updateRes.error) {
            return { error: updateRes.error }
        }
    }

    // 3) Güncel bakiye (current_balance) yeniden hesapla
    // current_balance = SUM(daily_wage - paid_amount) across all payroll_records for personnel

    const sumRes = await supabase
        .from('payroll_records')
        .select('daily_wage,paid_amount', { count: 'exact', head: false })
        // veri çeker; isterseniz RPC ile de yapılabilir
        .eq('personnel_id', personnel_id)

    if (sumRes.error) {
        // Bakiye hesaplanamadıysa, kayıt başarıyla upsert edilse dahi bu hatayı dönelim ki UI bilsin.
        return { id: recordId, balanceUpdated: false, error: sumRes.error }
    }

    const rows = (sumRes.data ?? []) as { daily_wage: number | null; paid_amount: number | null }[]

    const newBalance = rows.reduce((acc, r) => acc + (r.daily_wage ?? 0) - (r.paid_amount ?? 0), 0)

    const patchRes = await supabase
        .from('personnel')
        .update({ current_balance: newBalance })
        .eq('id', personnel_id)
        .select('id,current_balance')
        .single()

    if (patchRes.error) {
        return { id: recordId, balanceUpdated: false, error: patchRes.error }
    }

    return {
        id: recordId,
        balanceUpdated: true,
        current_balance: patchRes.data.current_balance
    }
}

// --- Work Order Mutations ---
export const createWorkOrder = async (workOrder: any) => {
    // 1. Calculate Dates
    const datesToInsert = [workOrder.date];

    if (workOrder.is_recurring) {
        console.log("Creating recurring order with params:", JSON.stringify(workOrder, null, 2));
        let currentDate = new Date(workOrder.date);

        // Determine End Date (User provided or Default 3 months)
        let endDate = new Date(workOrder.date);
        if (workOrder.recurring_end_date) {
            const parsed = new Date(workOrder.recurring_end_date);
            if (!isNaN(parsed.getTime())) {
                endDate = parsed;
            } else {
                console.warn("Invalid recurring_end_date provided, falling back to 3 months.");
                endDate.setMonth(endDate.getMonth() + 3);
            }
        } else {
            endDate.setMonth(endDate.getMonth() + 3);
        }
        console.log("Calculated End Date:", endDate.toISOString());

        // Safety cap (e.g. 2 years) to prevent infinite loops
        const safetyDate = new Date();
        safetyDate.setFullYear(safetyDate.getFullYear() + 2);
        if (endDate > safetyDate) endDate = safetyDate;

        if (workOrder.frequency === 'once_month') {
            // Loop months
            while (true) {
                currentDate.setMonth(currentDate.getMonth() + 1);
                if (currentDate > endDate) break;
                datesToInsert.push(currentDate.toISOString().split('T')[0]);
            }
        } else if (['once_week', 'twice_week'].includes(workOrder.frequency)) {
            const dayMap: Record<string, number> = { "Paz": 0, "Pzt": 1, "Sal": 2, "Çar": 3, "Per": 4, "Cum": 5, "Cmt": 6 };
            const targetDays = (workOrder.recurring_days || []).map((d: string) => dayMap[d]);

            let d = new Date(workOrder.date);

            if (targetDays.length > 0) {
                // Scan day by day
                while (true) {
                    d.setDate(d.getDate() + 1);
                    if (d > endDate) break;

                    if (targetDays.includes(d.getDay())) {
                        datesToInsert.push(d.toISOString().split('T')[0]);
                    }
                }
            } else {
                // Simple +7 days
                while (true) {
                    d.setDate(d.getDate() + 7);
                    if (d > endDate) break;
                    datesToInsert.push(d.toISOString().split('T')[0]);
                }
            }
        }
    }

    // 2. Prepare Payloads
    const payloads = datesToInsert.map((d, index) => ({
        customer_id: workOrder.customer_id,
        date: d,
        description: workOrder.description + (index > 0 ? ' (Tekrar)' : ''), // Mark recurring
        address: workOrder.address,
        price: workOrder.price,
        personnel_count: workOrder.personnel_count,
        status: 'onaylanmadı'
    }));

    // 3. Batch Insert
    const { data: createdJobs, error } = await supabase
        .from('work_orders')
        .insert(payloads)
        .select();

    if (error) throw error;

    // 4. Assignments
    if (workOrder.assigned_staff && Array.isArray(workOrder.assigned_staff) && workOrder.assigned_staff.length > 0) {
        const allAssignments = createdJobs!.flatMap(job =>
            workOrder.assigned_staff.map((staffId: any) => ({
                work_order_id: job.id,
                personnel_id: staffId
            }))
        );

        const { error: assignmentError } = await supabase
            .from('work_order_assignments')
            .insert(allAssignments);

        if (assignmentError) {
            console.error("Error creating assignments:", assignmentError);
        }
    }

    return createdJobs;
};

export const updateWorkOrder = async (id: string, workOrder: any) => {
    console.log("updateWorkOrder called with:", id, workOrder);

    // 1. Update main work order
    const { data, error } = await supabase
        .from('work_orders')
        .update({
            customer_id: workOrder.customer_id,
            date: workOrder.date,
            description: workOrder.description,
            address: workOrder.address,
            price: workOrder.price,
            personnel_count: workOrder.personnel_count,
        })
        .eq('id', id)
        .select()
        .single(); // This will throw if no rows updated/found if logic correct? No, Supabase usually returns null for 0 rows if not careful? 
    // .single() requires exactly one row.

    if (error) {
        console.error("Supabase update error:", error);
        throw error;
    }
    if (!data) throw new Error("İş emri güncellenemedi (Kayıt bulunamadı?)");

    if (error) throw error;

    // 2. Sync personnel assignments (Delete all existing, then insert new)
    // First, delete existing
    const { error: deleteError } = await supabase
        .from('work_order_assignments')
        .delete()
        .eq('work_order_id', id);

    if (deleteError) {
        console.error("Error deleting old assignments:", deleteError);
        // proceed anyway to try inserting new ones
    }

    // Now insert new if any
    if (workOrder.assigned_staff && Array.isArray(workOrder.assigned_staff) && workOrder.assigned_staff.length > 0) {
        const assignments = workOrder.assigned_staff.map((staffId: any) => ({
            work_order_id: id,
            personnel_id: staffId
        }));

        const { error: assignmentError } = await supabase
            .from('work_order_assignments')
            .insert(assignments);

        if (assignmentError) {
            console.error("Error saving new assignments:", assignmentError);
        }
    }

    return data;
};

export const approveWorkOrder = async (id: string) => {
    const { error } = await supabase
        .from('work_orders')
        .update({ status: 'onaylandı' })
        .eq('id', id);

    if (error) throw error;
};

// --- Daily Cash Page Functions ---

export const getDailyTransactions = async (date: string) => {
    const { data: collections, error: colError } = await supabase
        .from('collections')
        .select('*, customers(name)')
        .eq('date', date)
        .order('created_at', { ascending: true });

    if (colError) {
        console.error("Collection error:", colError);
        // Return empty on error to prevent total crash, or throw? Throwing is better for debug.
        throw colError;
    }

    const { data: expenses, error: expError } = await supabase
        .from('expenses')
        .select('*')
        .eq('date', date)
        .order('created_at', { ascending: true });

    if (expError) {
        console.error("Expense error:", expError);
        throw expError;
    }

    // --- Payroll Data ---
    const { data: todayPayroll } = await supabase
        .from('payroll_records')
        .select('paid_amount')
        .eq('date', date);

    const todayPaidWages = (todayPayroll || []).reduce((acc, p) => acc + (p.paid_amount || 0), 0);

    const { data: allPayroll } = await supabase
        .from('payroll_records')
        .select('daily_wage, paid_amount');

    const totalWageDebt = (allPayroll || []).reduce((acc, p) => acc + ((p.daily_wage || 0) - (p.paid_amount || 0)), 0);

    // --- Calculate Previous Balance (Dünden Kasa Devri) ---
    // Sum of all CASH income - Sum of all CASH expense before this date

    // Previous Collections (Cash)
    const { data: prevCol, error: prevColErr } = await supabase
        .from('collections')
        .select('amount')
        .lt('date', date)
        .in('payment_method', ['nakit', 'Nakit', 'NAKİT', 'Cash', 'cash']);

    // Previous Expenses (Cash)
    // Note: Expenses might use Capitalized 'Nakit' based on enum error history
    // Previous Expenses (Cash)
    const { data: prevExp, error: prevExpErr } = await supabase
        .from('expenses')
        .select('amount')
        .lt('date', date)
        .in('payment_method', ['nakit', 'Nakit', 'NAKİT', 'Cash', 'cash']);

    // Previous Wages (Cash)
    const { data: prevPayroll } = await supabase
        .from('payroll_records')
        .select('paid_amount')
        .lt('date', date);

    const totalPrevCol = prevCol?.reduce((a, b) => a + (b.amount || 0), 0) || 0;
    const totalPrevExp = prevExp?.reduce((a, b) => a + (b.amount || 0), 0) || 0;
    const totalPrevWages = prevPayroll?.reduce((a, b) => a + (b.paid_amount || 0), 0) || 0;

    const previousBalance = totalPrevCol - totalPrevExp - totalPrevWages;

    return {
        previousBalance,
        todayPaidWages,
        totalWageDebt,
        collections: collections.map(c => ({
            id: c.id,
            customer_id: c.customer_id,
            customer: c.customers?.name || 'Bilinmiyor',
            date: c.date,
            amount: c.amount,
            type: c.payment_method || 'Nakit',
            payment_method: c.payment_method
        })),
        expenses: expenses.map(e => ({
            id: e.id,
            detail: e.description,
            receiptNo: e.receipt_no || e.bill_no || '', // Prefer receipt_no, fallback bill_no
            amount: e.amount,
            date: e.date,
            method: e.payment_method || 'Nakit',
            category: e.category
        }))
    };
};

export const createCollection = async (data: any) => {
    // Validate
    if (!data.customer_id) throw new Error("Müşteri seçilmeli");

    // Ensure amount is number
    const payload = { ...data, amount: Number(data.amount) };

    const { error } = await supabase.from('collections').insert([payload]);
    if (error) {
        console.error("Create Col Error:", error);
        throw error;
    }
    return true;
};

export const updateCollection = async (id: number | string, data: any) => {
    const { error } = await supabase.from('collections').update(data).eq('id', id);
    if (error) throw error;
    return true;
};

export const deleteCollection = async (id: number | string) => {
    const { error } = await supabase.from('collections').delete().eq('id', id);
    if (error) throw error;
    return true;
};

export const createExpense = async (data: any) => {
    const { error } = await supabase.from('expenses').insert([data]);
    if (error) throw error;
    return true;
};

export const updateExpense = async (id: number | string, data: any) => {
    const { error } = await supabase.from('expenses').update(data).eq('id', id);
    if (error) throw error;
    return true;
};

export const deleteExpense = async (id: number | string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
    return true;
};

export const getStats = async (
    filterType: 'thisMonth' | 'allTime' | 'custom' = 'thisMonth',
    dateRange: { start: string, end: string }
) => {
    let startStr = dateRange.start;
    let endStr = dateRange.end;

    if (filterType === 'thisMonth') {
        const now = new Date();
        startStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        endStr = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    } else if (filterType === 'allTime') {
        startStr = '2020-01-01';
        endStr = '2099-12-31';
    }

    const { data: income } = await supabase
        .from('collections')
        .select('amount')
        .gte('date', startStr)
        .lte('date', endStr);

    const { data: expense } = await supabase
        .from('expenses')
        .select('amount')
        .gte('date', startStr)
        .lte('date', endStr);

    const totalIncome = (income || []).reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalExpense = (expense || []).reduce((sum, item) => sum + (item.amount || 0), 0);

    return {
        income: totalIncome,
        expense: totalExpense,
        balance: totalIncome - totalExpense
    };
};

// --- User / Profile Management ---

export const getProfiles = async () => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

    if (error) {
        console.error("Error fetching profiles:", error);
        throw error;
    }
    return data;
};

const mapRoleToDb = (role: string) => {
    switch (role) {
        case 'Yönetici': return 'sistem yöneticisi';
        case 'Sekreter': return 'sekreter';
        case 'Saha Sorumlusu': return 'saha sorumlusu';
        case 'Şoför': return 'şoför';
        case 'Veri Girici': return 'veri girici';
        default: return role?.toLowerCase();
    }
};

export const createProfile = async (profile: any) => {
    const { data, error } = await supabase
        .from('profiles')
        .insert([{
            full_name: profile.name,
            email: profile.email,
            role: mapRoleToDb(profile.role),
            phone: profile.phone,
            status: 'active'
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateProfile = async (id: string, updates: any) => {
    const { data, error } = await supabase
        .from('profiles')
        .update({
            full_name: updates.name,
            email: updates.email,
            role: mapRoleToDb(updates.role),
            phone: updates.phone
            // Password update is not possible here as it requires Auth Admin
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteProfile = async (id: string) => {
    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);
    if (error) throw error;
    return true;
};

// Script to reset all customer balances to 0
// Run with: node scripts/reset-customer-balances.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rzcumzfzurthasgptggd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6Y3VtemZ6dXJ0aGFzZ3B0Z2dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNDA5MzYsImV4cCI6MjA4MTcxNjkzNn0.NlyDKeMj-4xa7ZSt5wsyRdCOay8w2SAIA-ZTjIRkyHw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetAllCustomerBalances() {
    console.log('Fetching all customers...');

    // First, get all customer IDs
    const { data: customers, error: fetchError } = await supabase
        .from('customers')
        .select('id, name, current_balance');

    if (fetchError) {
        console.error('Error fetching customers:', fetchError);
        return;
    }

    console.log(`Found ${customers.length} customers`);

    // Log current balances before reset
    console.log('\nCurrent balances before reset:');
    customers.forEach(c => {
        if (c.current_balance !== 0) {
            console.log(`  - ${c.name}: ${c.current_balance}`);
        }
    });

    // Update all customers to have current_balance = 0
    const { data, error: updateError } = await supabase
        .from('customers')
        .update({ current_balance: 0 })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all (this condition is always true)

    if (updateError) {
        console.error('Error resetting balances:', updateError);
        return;
    }

    console.log('\n✅ All customer balances have been reset to 0!');

    // Verify
    const { data: verifyData, error: verifyError } = await supabase
        .from('customers')
        .select('id, name, current_balance')
        .neq('current_balance', 0);

    if (verifyError) {
        console.error('Error verifying:', verifyError);
        return;
    }

    if (verifyData.length === 0) {
        console.log('✅ Verification passed: All balances are now 0');
    } else {
        console.log('⚠️ Some balances were not reset:', verifyData);
    }
}

resetAllCustomerBalances();

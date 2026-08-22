import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bugrvnpslgamgzawpdbc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1Z3J2bnBzbGdhbWd6YXdwZGJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzM2OTU1OSwiZXhwIjoyMTAyOTQ1NTU5fQ.t-ciy9aaks2mTVZ5cjlLYAk5BRUj2_ssaxWoSUse5-A';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const mockUsers = [
  { email: 'hr@dayflow.demo', password: 'Demo@123', name: 'Priya Sharma', role: 'admin', position: 'HR Director', dept: 'Human Resources' },
  { email: 'employee@dayflow.demo', password: 'Demo@123', name: 'Arjun Mehta', role: 'employee', position: 'Senior Software Engineer', dept: 'Engineering' },
  { email: 'rahul.v@dayflow.demo', password: 'Demo@123', name: 'Rahul Verma', role: 'employee', position: 'Engineering Manager', dept: 'Engineering' },
  { email: 'sneha.k@dayflow.demo', password: 'Demo@123', name: 'Sneha Kapoor', role: 'employee', position: 'Product Manager', dept: 'Product' },
];

async function run() {
  console.log('Starting mock user creation...');
  
  for (const user of mockUsers) {
    console.log(`Processing ${user.email}...`);
    
    // 1. Try to delete the user if they exist to start fresh
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers.users.find(u => u.email === user.email);
    if (existing) {
      console.log(`Deleting existing user ${existing.id}`);
      await supabase.auth.admin.deleteUser(existing.id);
    }
    
    // 2. Create the user cleanly via Admin API
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { name: user.name }
    });
    
    if (createError) {
      console.error(`Error creating ${user.email}:`, createError);
      continue;
    }
    
    const userId = newUser.user.id;
    console.log(`Created user ${userId}`);
    
    // 3. Update their profile
    const { error: profileError } = await supabase.from('profiles').update({
      role: user.role,
      name: user.name,
      company_name: 'Odoo India',
      department: user.dept,
      position: user.position,
      status: 'Active'
    }).eq('id', userId);
    
    if (profileError) {
      console.error(`Error updating profile for ${user.email}:`, profileError);
    } else {
      console.log(`Updated profile for ${user.email}`);
    }
  }
  
  console.log('Done!');
}

run();

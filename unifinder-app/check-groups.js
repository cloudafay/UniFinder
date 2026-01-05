// Grupları kontrol et
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGroups() {
  try {
    // 1. Tüm grupları listele (service role ile)
    console.log('\n=== TÜM GRUPLAR ===');
    const { data: groups, error: groupError } = await supabase
      .from('group_chats')
      .select('*');
    
    if (groupError) {
      console.log('Grup sorgu hatası:', groupError.message);
    } else {
      console.log('Toplam grup sayısı:', groups?.length || 0);
      groups?.forEach(g => {
        console.log(`  - ${g.name} (ID: ${g.id.substring(0, 8)}...) - Creator: ${g.creator_id?.substring(0, 8)}...`);
      });
    }

    // 2. Grup üyeliklerini listele
    console.log('\n=== GRUP ÜYELİKLERİ ===');
    const { data: members, error: memberError } = await supabase
      .from('group_members')
      .select('*');
    
    if (memberError) {
      console.log('Üyelik sorgu hatası:', memberError.message);
    } else {
      console.log('Toplam üyelik sayısı:', members?.length || 0);
      members?.forEach(m => {
        console.log(`  - Group: ${m.group_id?.substring(0, 8)}... User: ${m.user_id?.substring(0, 8)}... Role: ${m.role}`);
      });
    }

    // 3. kaosbey21 kullanıcısının ID'sini bul
    console.log('\n=== kaosbey21 KULLANICISI ===');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('email', 'kaosbey21@gmail.com')
      .single();
    
    if (profileError) {
      console.log('Profil hatası:', profileError.message);
    } else {
      console.log('Kullanıcı bulundu:', profile);
      
      // 4. Bu kullanıcının gruplarını getir
      console.log('\n=== KULLANICININ ÜYELİKLERİ ===');
      const { data: userMemberships, error: userMemberError } = await supabase
        .from('group_members')
        .select('*')
        .eq('user_id', profile.id);
      
      if (userMemberError) {
        console.log('Üyelik sorgu hatası:', userMemberError.message);
      } else {
        console.log('Üyelik sayısı:', userMemberships?.length || 0);
        userMemberships?.forEach(m => {
          console.log(`  - Group ID: ${m.group_id}`);
        });
      }

      // 5. Bu kullanıcının oluşturduğu gruplar
      console.log('\n=== KULLANICININ OLUŞTURDUĞU GRUPLAR ===');
      const { data: createdGroups, error: createdError } = await supabase
        .from('group_chats')
        .select('*')
        .eq('creator_id', profile.id);
      
      if (createdError) {
        console.log('Oluşturulan grup hatası:', createdError.message);
      } else {
        console.log('Oluşturulan grup sayısı:', createdGroups?.length || 0);
        createdGroups?.forEach(g => {
          console.log(`  - ${g.name} (ID: ${g.id})`);
        });
      }
    }

  } catch (error) {
    console.error('Script hatası:', error);
  }
}

checkGroups();

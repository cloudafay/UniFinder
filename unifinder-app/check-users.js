// Kullanıcı fotoğraf durumu kontrol scripti
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ckvgbgvuecnttyxqnppm.supabase.co',
  'sb_publishable_jxtsnjveps57WUmHJR2-Xw_Yi9MHMge'
);

async function checkUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, photos, avatar_url, department, year');

  if (error) {
    console.log('Hata:', error.message);
    return;
  }

  console.log('\n=== KULLANICI DURUMU ===\n');
  
  data.forEach((user, index) => {
    const hasPhotos = user.photos && user.photos.length > 0;
    const hasAvatar = !!user.avatar_url;
    const status = hasPhotos ? '✅ HAZIR' : '❌ FOTOĞRAF YOK';
    
    console.log(`${index + 1}. ${user.full_name || 'İsimsiz'}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Bölüm: ${user.department || '-'}`);
    console.log(`   Sınıf: ${user.year || '-'}`);
    console.log(`   Fotoğraf Sayısı: ${user.photos?.length || 0}`);
    console.log(`   Avatar: ${hasAvatar ? 'VAR' : 'YOK'}`);
    console.log(`   Durum: ${status}`);
    if (user.photos && user.photos.length > 0) {
      console.log(`   İlk Fotoğraf: ${user.photos[0].substring(0, 60)}...`);
    }
    console.log('');
  });

  const readyCount = data.filter(u => u.photos && u.photos.length > 0).length;
  console.log(`\n=== ÖZET ===`);
  console.log(`Toplam: ${data.length} kullanıcı`);
  console.log(`Swipe için hazır: ${readyCount} kullanıcı`);
  console.log(`Fotoğraf eksik: ${data.length - readyCount} kullanıcı`);
}

checkUsers();

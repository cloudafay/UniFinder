
const { createClient } = require('@supabase/supabase-js');

// Proje URL ve Key'lerini environment variable'dan veya hardcoded alacağız (Geçici script olduğu için).
// Not: Normalde hardcode önerilmez ama bu tek kullanımlık bir test scripti.
// Kullanıcının .env dosyasına erişimim yok ama expo config çıktısından veya önceki dosyalardan proje bilgilerini hatırlıyorum.
// Ancak en garantisi process.env kullanmak ama burada terminalde env var set etmem gerek.
// Basitlik adına service role key lazım olabilir çünkü admin işlemi yapacağım ama anon key ile signUp yapıp sonra update edebilirim.

// .env dosyasını okumaya çalışacağım önce.
require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Error: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY must be set in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const users = [
    {
        email: 'ahmet.yilmaz@itu.edu.tr',
        password: 'password123',
        full_name: 'Ahmet Yılmaz',
        department: 'Bilgisayar Mühendisliği',
        year: '3. Sınıf',
        bio: 'Teknoloji ve yazılım tutkunu. Kampüste kahve içmeyi severim.',
        interests: ['Yazılım', 'Kahve', 'Spor'],
        photos: [
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=60',
            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=60'
        ]
    },
    {
        email: 'ayse.demir@boun.edu.tr',
        password: 'password123',
        full_name: 'Ayşe Demir',
        department: 'Mimarlık',
        year: '2. Sınıf',
        bio: 'Tasarım ve sanatla ilgileniyorum. Gezmeyi çok severim.',
        interests: ['Mimari', 'Sanat', 'Fotoğrafçılık'],
        photos: [
            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&auto=format&fit=crop&q=60',
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=60',
            'https://images.unsplash.com/photo-1554151228-14d9def656ec?w=500&auto=format&fit=crop&q=60'
        ]
    }
];

async function createTestUsers() {
    console.log('Creating test users...');

    for (const user of users) {
        console.log(`Creating user: ${user.full_name} (${user.email})`);

        // 1. Sign Up
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: user.email,
            password: user.password,
            options: {
                data: {
                    fullName: user.full_name
                }
            }
        });

        if (authError) {
            console.error(`Error creating auth user ${user.email}:`, authError.message);
            continue;
        }

        if (!authData.user) {
            console.error(`User object missing for ${user.email}`);
            continue;
        }

        const userId = authData.user.id;
        console.log(`Auth user created. ID: ${userId}`);

        // Wait a bit for trigger if exists (optional but safe)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 2. Update Profile
        // Trigger might have created the profile, so we use upsert or update
        const profileData = {
            id: userId, // Ensure ID matches
            full_name: user.full_name,
            department: user.department,
            year: user.year,
            bio: user.bio,
            interests: user.interests,
            photos: user.photos,
            avatar_url: user.photos[0], // Explicitly setting avatar_url from 1st photo
            is_active: true,
            updated_at: new Date().toISOString()
        };

        const { error: profileError } = await supabase
            .from('profiles')
            .upsert(profileData)
            .eq('id', userId);

        if (profileError) {
            console.error(`Error updating profile for ${user.email}:`, profileError.message);
        } else {
            console.log(`Profile updated successfully for ${user.full_name}. Avatar URL set: ${!!user.photos[0]}`);
        }
    }

    console.log('Done!');
}

createTestUsers();

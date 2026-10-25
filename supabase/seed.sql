insert into public.categories (id, slug, name_id, name_en, description_id, description_en)
values
  ('c0000000-0000-4000-8000-000000000001', 'nutrisi', 'Nutrisi & Gizi', 'Nutrition', 'Makanan, pola makan, suplemen, dan gizi sehari-hari.', 'Food, diet, supplements, and everyday nutrition.'),
  ('c0000000-0000-4000-8000-000000000002', 'vaksin', 'Vaksin & Imunitas', 'Vaccines & Immunity', 'Vaksin, kekebalan tubuh, dan pencegahan infeksi.', 'Vaccines, immunity, and infection prevention.'),
  ('c0000000-0000-4000-8000-000000000003', 'penyakit-tidak-menular', 'Penyakit Tidak Menular', 'Non-communicable Disease', 'Jantung, diabetes, tekanan darah, dan kanker.', 'Heart disease, diabetes, blood pressure, and cancer.'),
  ('c0000000-0000-4000-8000-000000000004', 'pengobatan', 'Pengobatan & Suplemen', 'Treatment & Supplements', 'Obat, terapi, herbal, dan klaim pengobatan.', 'Medicine, therapy, herbal products, and treatment claims.'),
  ('c0000000-0000-4000-8000-000000000005', 'gaya-hidup', 'Gaya Hidup', 'Lifestyle', 'Aktivitas fisik, tidur, rokok, dan kebiasaan harian.', 'Physical activity, sleep, smoking, and daily habits.'),
  ('c0000000-0000-4000-8000-000000000006', 'kesehatan-mental', 'Kesehatan Mental', 'Mental Health', 'Stres, kecemasan, suasana hati, dan dukungan psikologis.', 'Stress, anxiety, mood, and psychological support.'),
  ('c0000000-0000-4000-8000-000000000007', 'kesehatan-anak', 'Kesehatan Anak', 'Child Health', 'Tumbuh kembang, imunisasi, dan kesehatan anak.', 'Development, immunization, and child health.'),
  ('c0000000-0000-4000-8000-000000000008', 'kehamilan', 'Kehamilan', 'Pregnancy', 'Kehamilan, menyusui, dan kesehatan ibu.', 'Pregnancy, breastfeeding, and maternal health.')
on conflict (slug) do update set
  name_id = excluded.name_id,
  name_en = excluded.name_en,
  description_id = excluded.description_id,
  description_en = excluded.description_en;

insert into public.badges (code, name_id, name_en, description_id, description_en, type, threshold, icon_key)
values
  ('verification-sprout', 'Tunas Verifikasi', 'Verification Sprout', 'Dapatkan 5 jawaban game yang benar.', 'Earn 5 correct game answers.', 'verification_count', 5, 'sprout'),
  ('verification-leaf', 'Daun Bukti', 'Evidence Leaf', 'Kumpulkan 25 jawaban game yang benar.', 'Collect 25 correct game answers.', 'verification_count', 25, 'leaf'),
  ('verification-tree', 'Pohon Pengetahuan', 'Knowledge Tree', 'Kumpulkan 100 jawaban game yang benar.', 'Collect 100 correct game answers.', 'verification_count', 100, 'tree'),
  ('streak-flame', 'Percikan Streak', 'Streak Spark', 'Jaga streak selama 3 hari berturut-turut.', 'Keep a 3-day streak.', 'streak', 3, 'flame'),
  ('streak-star', 'Bintang Konsisten', 'Consistency Star', 'Jaga streak selama 7 hari berturut-turut.', 'Keep a 7-day streak.', 'streak', 7, 'star'),
  ('streak-shield', 'Perisai Sebulan', 'Monthly Shield', 'Jaga streak selama 30 hari berturut-turut.', 'Keep a 30-day streak.', 'streak', 30, 'shield')
on conflict (code) do update set
  name_id = excluded.name_id,
  name_en = excluded.name_en,
  description_id = excluded.description_id,
  description_en = excluded.description_en,
  type = excluded.type,
  threshold = excluded.threshold,
  icon_key = excluded.icon_key;

insert into private.system_settings (key, value)
values
  ('claim_analysis_enabled', 'true'::jsonb),
  ('forum_moderation_fail_closed', 'true'::jsonb),
  ('max_claim_text_length', '4000'::jsonb),
  ('default_locale', '"id"'::jsonb),
  ('methodology_version', '"RAG-2026.10"'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

insert into public.game_statements (statement_id, statement_en, is_fact, explanation_id, explanation_en, source_url, category_id)
values
  ('Vaksin HPV menurunkan risiko kanker serviks.', 'The HPV vaccine lowers the risk of cervical cancer.', true,
   'Vaksin HPV mencegah infeksi tipe HPV berisiko tinggi yang menyebabkan sebagian besar kanker serviks. Vaksinasi tetap dilengkapi skrining.',
   'HPV vaccines prevent infection with high-risk HPV types that cause most cervical cancers. Vaccination still works alongside screening.',
   'https://www.who.int/news-room/fact-sheets/detail/human-papillomavirus-(hpv)-and-cervical-cancer',
   (select id from public.categories where slug = 'vaksin')),
  ('Antibiotik efektif untuk menyembuhkan flu.', 'Antibiotics are effective for treating influenza.', false,
   'Flu disebabkan virus. Antibiotik hanya membunuh bakteri dan tidak mengobati infeksi virus.',
   'Flu is caused by a virus. Antibiotics only kill bacteria and do not treat viral infections.',
   'https://www.cdc.gov/antibiotic-use/about/index.html',
   (select id from public.categories where slug = 'pengobatan')),
  ('Berjalan kaki 30 menit sehari dapat membantu menurunkan tekanan darah.', 'Walking 30 minutes a day can help lower blood pressure.', true,
   'Aktivitas fisik aerobik seperti jalan kaki membantu menurunkan tekanan darah dan risiko kardiovaskular.',
   'Aerobic activity such as walking helps lower blood pressure and cardiovascular risk.',
   'https://www.cdc.gov/physical-activity-basics/guidelines/adults.html',
   (select id from public.categories where slug = 'gaya-hidup')),
  ('Vitamin C 1000 mg mencegah flu pada semua orang.', 'Vitamin C 1000 mg prevents colds in everyone.', false,
   'Bukti tidak menunjukkan vitamin C dosis tinggi mencegah pilek pada populasi umum. Suplementasi dapat sedikit mempersingkat durasi pada sebagian orang.',
   'Evidence does not show high-dose vitamin C prevents colds in the general population. Supplementation may slightly shorten duration for some people.',
   'https://ods.od.nih.gov/factsheets/VitaminC-HealthProfessional/',
   (select id from public.categories where slug = 'nutrisi')),
  ('Konsumsi garam berlebih menaikkan tekanan darah.', 'Eating too much salt raises blood pressure.', true,
   'Asupan natrium tinggi berkaitan dengan peningkatan tekanan darah dan risiko penyakit kardiovaskular.',
   'High sodium intake is linked to higher blood pressure and cardiovascular disease risk.',
   'https://www.who.int/news-room/fact-sheets/detail/salt-reduction',
   (select id from public.categories where slug = 'nutrisi')),
  ('Daun sirsak membunuh sel kanker pada manusia.', 'Soursop leaves kill cancer cells in humans.', false,
   'Belum ada bukti uji klinis pada manusia bahwa daun sirsak menyembuhkan kanker. Klaim laboratorium tidak sama dengan efek pada pasien.',
   'There is no clinical trial evidence in humans that soursop leaves cure cancer. Laboratory findings are not the same as effects in patients.',
   'https://www.cancer.gov/about-cancer/treatment/cam/patient/graviola-pdq',
   (select id from public.categories where slug = 'pengobatan')),
  ('Vaksin HPV menyebabkan kemandulan.', 'The HPV vaccine causes infertility.', false,
   'Tinjauan bukti tidak menemukan hubungan antara vaksin HPV dan infertilitas. Vaksin ini mencegah kanker serviks.',
   'Evidence reviews have not found a link between HPV vaccination and infertility. The vaccine prevents cervical cancer.',
   'https://www.who.int/news-room/fact-sheets/detail/human-papillomavirus-(hpv)-and-cervical-cancer',
   (select id from public.categories where slug = 'vaksin')),
  ('Merokok meningkatkan risiko kanker paru.', 'Smoking increases the risk of lung cancer.', true,
   'Tembakau adalah penyebab utama kanker paru dan banyak penyakit kronis lainnya.',
   'Tobacco is the leading cause of lung cancer and many other chronic diseases.',
   'https://www.who.int/news-room/fact-sheets/detail/tobacco',
   (select id from public.categories where slug = 'gaya-hidup')),
  ('Suplemen herbal selalu aman karena berasal dari bahan alami.', 'Herbal supplements are always safe because they are natural.', false,
   'Produk alami tetap dapat berinteraksi dengan obat, merusak organ, atau mengandung bahan berbahaya. Konsultasikan dengan tenaga kesehatan.',
   'Natural products can still interact with medicines, harm organs, or contain unsafe ingredients. Check with a health professional.',
   'https://www.nccih.nih.gov/health/herbsataglance',
   (select id from public.categories where slug = 'pengobatan')),
  ('Orang dewasa membutuhkan tidur 7 hingga 9 jam demi kesehatan yang baik.', 'Adults need 7 to 9 hours of sleep for good health.', true,
   'Kurang tidur berkaitan dengan gangguan metabolik, kardiovaskular, dan kesehatan mental. Kebutuhan tiap orang dapat berbeda.',
   'Short sleep is linked to metabolic, cardiovascular, and mental health problems. Individual needs can vary.',
   'https://www.cdc.gov/sleep/about_sleep/how_much_sleep.html',
   (select id from public.categories where slug = 'gaya-hidup')),
  ('Air garam menyembuhkan flu dalam satu hari.', 'Salt water cures flu in one day.', false,
   'Air garam tidak membunuh virus influenza. Istirahat, cairan, dan perawatan suportif membantu, tetapi bukan obat flu.',
   'Salt water does not kill influenza viruses. Rest, fluids, and supportive care help, but they are not a flu cure.',
   'https://www.who.int/news-room/fact-sheets/detail/influenza-(seasonal)',
   (select id from public.categories where slug = 'pengobatan')),
  ('Mencuci tangan dengan sabun mengurangi penyebaran infeksi.', 'Handwashing with soap reduces the spread of infection.', true,
   'Mencuci tangan dengan sabun menurunkan transmisi patogen dan infeksi saluran napas serta pencernaan.',
   'Washing hands with soap reduces the transmission of pathogens and respiratory and gastrointestinal infections.',
   'https://www.who.int/news-room/fact-sheets/detail/clean-hands-save-lives',
   (select id from public.categories where slug = 'gaya-hidup'))
on conflict (statement_id) do update set
  statement_en = excluded.statement_en,
  is_fact = excluded.is_fact,
  explanation_id = excluded.explanation_id,
  explanation_en = excluded.explanation_en,
  source_url = excluded.source_url,
  category_id = excluded.category_id;

insert into private.kb_sources (id, type, title, author, year, category_id, status, source_url)
values
  ('11111111-1111-4111-8111-111111111111', 'article', 'Influenza (Seasonal) fact sheet', 'World Health Organization', 2025,
   (select id from public.categories where slug = 'pengobatan'), 'chunked',
   'https://www.who.int/news-room/fact-sheets/detail/influenza-(seasonal)'),
  ('22222222-2222-4222-8222-222222222222', 'article', 'Salt reduction fact sheet', 'World Health Organization', 2023,
   (select id from public.categories where slug = 'nutrisi'), 'chunked',
   'https://www.who.int/news-room/fact-sheets/detail/salt-reduction'),
  ('33333333-3333-4333-8333-333333333333', 'article', 'HPV and cervical cancer fact sheet', 'World Health Organization', 2024,
   (select id from public.categories where slug = 'vaksin'), 'chunked',
   'https://www.who.int/news-room/fact-sheets/detail/human-papillomavirus-(hpv)-and-cervical-cancer'),
  ('44444444-4444-4444-8444-444444444444', 'article', 'Physical Activity Basics', 'Centers for Disease Control and Prevention', 2024,
   (select id from public.categories where slug = 'gaya-hidup'), 'chunked',
   'https://www.cdc.gov/physical-activity-basics/guidelines/adults.html'),
  ('55555555-5555-4555-8555-555555555555', 'article', 'Vitamin C fact sheet', 'National Institutes of Health, Office of Dietary Supplements', 2024,
   (select id from public.categories where slug = 'nutrisi'), 'chunked',
   'https://ods.od.nih.gov/factsheets/VitaminC-HealthProfessional/')
on conflict (id) do update set
  title = excluded.title,
  author = excluded.author,
  year = excluded.year,
  category_id = excluded.category_id,
  status = excluded.status,
  source_url = excluded.source_url;

insert into private.kb_chunks (source_id, chunk_index, content, token_count, status)
values
  ('11111111-1111-4111-8111-111111111111', 1,
   'Influenza adalah infeksi saluran napas yang disebabkan virus influenza. Sebagian besar orang pulih sendiri, tetapi kelompok berisiko dapat mengalami komplikasi serius. Vaksinasi influenza mengurangi risiko penyakit berat. Air garam tidak membunuh virus influenza dan bukan pengobatan antivirus.',
   62, 'approved'),
  ('11111111-1111-4111-8111-111111111111', 2,
   'Perawatan suportif flu mencakup istirahat, asupan cairan yang cukup, dan obat pereda gejala. Antibiotik tidak efektif untuk infeksi virus. Orang dengan penyakit berat atau kelompok berisiko perlu mencari bantuan medis.',
   45, 'approved'),
  ('22222222-2222-4222-8222-222222222222', 1,
   'Asupan natrium tinggi berkaitan dengan peningkatan tekanan darah dan risiko penyakit kardiovaskular. WHO menganjurkan mengurangi asupan garam menjadi kurang dari 5 gram per hari pada orang dewasa. Sebagian besar natrium berasal dari makanan olahan.',
   50, 'approved'),
  ('22222222-2222-4222-8222-222222222222', 2,
   'Mengurangi garam dapat menurunkan tekanan darah pada banyak orang, terutama mereka dengan hipertensi. Membaca label nutrisi dan mengurangi makanan olahan membantu mengendalikan asupan natrium. Air garam bukan terapi untuk tekanan darah tinggi.',
   42, 'approved'),
  ('33333333-3333-4333-8333-333333333333', 1,
   'Infeksi HPV berisiko tinggi menyebabkan sebagian besar kanker serviks. Vaksin HPV mencegah infeksi tipe HPV utama yang berhubungan dengan kanker. Vaksinasi paling efektif bila diberikan sebelum terpapar virus.',
   40, 'approved'),
  ('33333333-3333-4333-8333-333333333333', 2,
   'Vaksin HPV telah melalui tinjauan keamanan yang luas. Bukti tidak menunjukkan bahwa vaksin HPV menyebabkan infertilitas. Vaksinasi dan skrining serviks saling melengkapi, bukan saling menggantikan.',
   37, 'approved'),
  ('44444444-4444-4444-8444-444444444444', 1,
   'Aktivitas aerobik sedang selama 150 menit per minggu dianjurkan untuk orang dewasa. Jalan kaki termasuk aktivitas aerobik yang mudah dilakukan. Aktivitas fisik membantu menurunkan tekanan darah dan risiko penyakit jantung.',
   41, 'approved'),
  ('44444444-4444-4444-8444-444444444444', 2,
   'Orang yang belum aktif dapat mulai dengan durasi pendek dan meningkat secara bertahap. Aktivitas fisik juga mendukung kesehatan mental dan tidur. Hentikan aktivitas dan cari bantuan medis bila muncul nyeri dada atau sesak berat.',
   40, 'approved'),
  ('55555555-5555-4555-8555-555555555555', 1,
   'Vitamin C berperan dalam fungsi imun dan sintesis kolagen. Bukti tidak menunjukkan bahwa vitamin C dosis tinggi mencegah pilek pada populasi umum. Suplementasi dapat sedikit mempersingkat durasi pilek pada sebagian orang.',
   40, 'approved'),
  ('55555555-5555-4555-8555-555555555555', 2,
   'Batas asupan vitamin C tertinggi untuk orang dewasa adalah 2000 mg per hari. Dosis sangat tinggi dapat menyebabkan gangguan pencernaan. Makanan seperti buah dan sayur menjadi sumber utama yang dianjurkan.',
   37, 'approved')
on conflict (source_id, chunk_index) do update set
  content = excluded.content,
  token_count = excluded.token_count,
  status = excluded.status;

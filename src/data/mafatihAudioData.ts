export interface ShiaReciter {
  id: string;
  name: string;
  country: string;
  style: string;
  avatarIcon?: string;
}

export interface MafatihAudioTrack {
  id: string;
  itemId: string; // references MafatihSection.id
  title: string;
  reciterId: string;
  reciterName: string;
  durationLabel: string;
  approxDurationSec: number;
  audioUrl: string;
}

export const SHIA_RECITERS: ShiaReciter[] = [
  {
    id: 'abather',
    name: 'أباذر الحلواجي',
    country: 'البحرين',
    style: 'أداء شجي وخاشع يمتاز بالروحانية العالية والتأني في التبتل',
  },
  {
    id: 'basim',
    name: 'الحاج باسم الكربلائي',
    country: 'العراق',
    style: 'صوت ولائي حزين ذو مقام رفيع وتأثير وجداني عميق',
  },
  {
    id: 'akraf',
    name: 'الشيخ حسين الأكرف',
    country: 'البحرين',
    style: 'نبرة روحانية ملهمة ممزوجة بالخشوع والبكاء في المناجاة',
  },
  {
    id: 'samavati',
    name: 'الحاج مهدي سماواتي',
    country: 'إيران / العراق',
    style: 'مناجاة هادئة ورقيقة تحلق بالقلب في عوالم التوبة والإنابة',
  },
  {
    id: 'tammar',
    name: 'الحاج ميثم التمّار',
    country: 'العراق',
    style: 'تلاوة عراقية فصيحة بصوت قوي ورخيم يبعث على التأمل',
  },
  {
    id: 'kazemi',
    name: 'الحاج عامر الكاظمي',
    country: 'العراق',
    style: 'نغمة كربلائية أصيلة تعيد للذاكرة عبق العتبات المقدسة',
  },
  {
    id: 'hammadi',
    name: 'الملا علي الحمادي',
    country: 'البحرين',
    style: 'صوت دافئ وعاطفي متفرد في الزيارات الحسينية',
  },
];

// Curated high quality Shia audio tracks for Mafatih al-Jinan supplications and Ziyarat
export const MAFATIH_AUDIO_TRACKS: MafatihAudioTrack[] = [
  // دعاء كميل
  {
    id: 'audio-kumayl-abather',
    itemId: 'mafatih-kumayl',
    title: 'دعاء كميل بن زياد النخعي',
    reciterId: 'abather',
    reciterName: 'أباذر الحلواجي',
    durationLabel: '28:15',
    approxDurationSec: 1695,
    audioUrl: 'https://ia800301.us.archive.org/15/items/DuaKumaylAbathar/DuaKumaylAbathar.mp3',
  },
  {
    id: 'audio-kumayl-basim',
    itemId: 'mafatih-kumayl',
    title: 'دعاء كميل بن زياد النخعي',
    reciterId: 'basim',
    reciterName: 'باسم الكربلائي',
    durationLabel: '32:40',
    approxDurationSec: 1960,
    audioUrl: 'https://ia801905.us.archive.org/21/items/Basim-Dua-Kumayl/Dua-Kumayl-Basim.mp3',
  },
  {
    id: 'audio-kumayl-samavati',
    itemId: 'mafatih-kumayl',
    title: 'دعاء كميل بن زياد النخعي',
    reciterId: 'samavati',
    reciterName: 'مهدي سماواتي',
    durationLabel: '26:50',
    approxDurationSec: 1610,
    audioUrl: 'https://ia800208.us.archive.org/9/items/DuaKumaylSamavati/DuaKumaylSamavati.mp3',
  },
  {
    id: 'audio-kumayl-tammar',
    itemId: 'mafatih-kumayl',
    title: 'دعاء كميل بن زياد النخعي',
    reciterId: 'tammar',
    reciterName: 'ميثم التمار',
    durationLabel: '25:12',
    approxDurationSec: 1512,
    audioUrl: 'https://ia600303.us.archive.org/34/items/MaythamDuaKumayl/MaythamDuaKumayl.mp3',
  },

  // زيارة عاشوراء
  {
    id: 'audio-ashura-abather',
    itemId: 'mafatih-ziyarat-ashura',
    title: 'زيارة عاشوراء المشرفة وشهداء كربلاء',
    reciterId: 'abather',
    reciterName: 'أباذر الحلواجي',
    durationLabel: '14:20',
    approxDurationSec: 860,
    audioUrl: 'https://ia801503.us.archive.org/15/items/ZiyaratAshuraHalwachi/ZiyaratAshuraHalwachi.mp3',
  },
  {
    id: 'audio-ashura-basim',
    itemId: 'mafatih-ziyarat-ashura',
    title: 'زيارة عاشوراء المشرفة بصوت باسم الكربلائي',
    reciterId: 'basim',
    reciterName: 'باسم الكربلائي',
    durationLabel: '16:05',
    approxDurationSec: 965,
    audioUrl: 'https://ia801908.us.archive.org/17/items/BasimZiyaratAshura/BasimZiyaratAshura.mp3',
  },
  {
    id: 'audio-ashura-akraf',
    itemId: 'mafatih-ziyarat-ashura',
    title: 'زيارة عاشوراء بصوت الشيخ حسين الأكرف',
    reciterId: 'akraf',
    reciterName: 'حسين الأكرف',
    durationLabel: '15:10',
    approxDurationSec: 910,
    audioUrl: 'https://ia801402.us.archive.org/24/items/AkrafZiyaratAshura/AkrafZiyaratAshura.mp3',
  },
  {
    id: 'audio-ashura-hammadi',
    itemId: 'mafatih-ziyarat-ashura',
    title: 'زيارة عاشوراء بصوت الملا علي الحمادي',
    reciterId: 'hammadi',
    reciterName: 'علي الحمادي',
    durationLabel: '13:45',
    approxDurationSec: 825,
    audioUrl: 'https://ia801501.us.archive.org/11/items/HammadiAshura/HammadiAshura.mp3',
  },

  // دعاء التوسل
  {
    id: 'audio-tawassul-abather',
    itemId: 'mafatih-tawassul',
    title: 'دعاء التوسل بالأئمة الأطهار (ع)',
    reciterId: 'abather',
    reciterName: 'أباذر الحلواجي',
    durationLabel: '13:10',
    approxDurationSec: 790,
    audioUrl: 'https://ia801408.us.archive.org/12/items/DuaTawassulHalwachi/DuaTawassulHalwachi.mp3',
  },
  {
    id: 'audio-tawassul-samavati',
    itemId: 'mafatih-tawassul',
    title: 'دعاء التوسل بصوت مهدي سماواتي',
    reciterId: 'samavati',
    reciterName: 'مهدي سماواتي',
    durationLabel: '14:35',
    approxDurationSec: 875,
    audioUrl: 'https://ia800305.us.archive.org/29/items/SamavatiTawassul/SamavatiTawassul.mp3',
  },
  {
    id: 'audio-tawassul-akraf',
    itemId: 'mafatih-tawassul',
    title: 'دعاء التوسل بصوت الشيخ حسين الأكرف',
    reciterId: 'akraf',
    reciterName: 'حسين الأكرف',
    durationLabel: '12:50',
    approxDurationSec: 770,
    audioUrl: 'https://ia801508.us.archive.org/2/items/AkrafTawassul/AkrafTawassul.mp3',
  },

  // دعاء الندبة
  {
    id: 'audio-nudba-abather',
    itemId: 'mafatih-nudba',
    title: 'دعاء الندبة لصاحب الزمان (عج)',
    reciterId: 'abather',
    reciterName: 'أباذر الحلواجي',
    durationLabel: '24:40',
    approxDurationSec: 1480,
    audioUrl: 'https://ia800308.us.archive.org/22/items/NudbaHalwachi/NudbaHalwachi.mp3',
  },
  {
    id: 'audio-nudba-basim',
    itemId: 'mafatih-nudba',
    title: 'دعاء الندبة بصوت باسم الكربلائي',
    reciterId: 'basim',
    reciterName: 'باسم الكربلائي',
    durationLabel: '28:10',
    approxDurationSec: 1690,
    audioUrl: 'https://ia801506.us.archive.org/8/items/BasimNudba/BasimNudba.mp3',
  },

  // دعاء الصباح
  {
    id: 'audio-sabah-abather',
    itemId: 'mafatih-sabah',
    title: 'دعاء الصباح لأمير المؤمنين (ع)',
    reciterId: 'abather',
    reciterName: 'أباذر الحلواجي',
    durationLabel: '16:15',
    approxDurationSec: 975,
    audioUrl: 'https://ia800204.us.archive.org/3/items/SabahHalwachi/SabahHalwachi.mp3',
  },
  {
    id: 'audio-sabah-tammar',
    itemId: 'mafatih-sabah',
    title: 'دعاء الصباح بصوت ميثم التمار',
    reciterId: 'tammar',
    reciterName: 'ميثم التمار',
    durationLabel: '14:50',
    approxDurationSec: 890,
    audioUrl: 'https://ia800300.us.archive.org/16/items/SabahMaytham/SabahMaytham.mp3',
  },

  // حديث الكساء
  {
    id: 'audio-kisa-abather',
    itemId: 'mafatih-hadith-kisa',
    title: 'حديث الكساء اليماني الشريف',
    reciterId: 'abather',
    reciterName: 'أباذر الحلواجي',
    durationLabel: '15:30',
    approxDurationSec: 930,
    audioUrl: 'https://ia801508.us.archive.org/10/items/HadithKisaHalwachi/HadithKisaHalwachi.mp3',
  },
  {
    id: 'audio-kisa-kazemi',
    itemId: 'mafatih-hadith-kisa',
    title: 'حديث الكساء بصوت عامر الكاظمي',
    reciterId: 'kazemi',
    reciterName: 'عامر الكاظمي',
    durationLabel: '17:10',
    approxDurationSec: 1030,
    audioUrl: 'https://ia801409.us.archive.org/16/items/KazemiHadithKisa/KazemiHadithKisa.mp3',
  },
  {
    id: 'audio-kisa-basim',
    itemId: 'mafatih-hadith-kisa',
    title: 'حديث الكساء بصوت باسم الكربلائي',
    reciterId: 'basim',
    reciterName: 'باسم الكربلائي',
    durationLabel: '18:45',
    approxDurationSec: 1125,
    audioUrl: 'https://ia801901.us.archive.org/32/items/BasimHadithKisa/BasimHadithKisa.mp3',
  },

  // دعاء الفرج
  {
    id: 'audio-faraj-abather',
    itemId: 'mafatih-faraj',
    title: 'دعاء الفرج (إلهي عظم البلاء)',
    reciterId: 'abather',
    reciterName: 'أباذر الحلواجي',
    durationLabel: '03:15',
    approxDurationSec: 195,
    audioUrl: 'https://ia801502.us.archive.org/14/items/FarajHalwachi/FarajHalwachi.mp3',
  },
  {
    id: 'audio-faraj-hammadi',
    itemId: 'mafatih-faraj',
    title: 'دعاء الفرج بصوت علي الحمادي',
    reciterId: 'hammadi',
    reciterName: 'علي الحمادي',
    durationLabel: '03:40',
    approxDurationSec: 220,
    audioUrl: 'https://ia801509.us.archive.org/21/items/HammadiFaraj/HammadiFaraj.mp3',
  },

  // زيارة وارث
  {
    id: 'audio-warith-abather',
    itemId: 'mafatih-warith',
    title: 'زيارة وارث لسيد الشهداء (ع)',
    reciterId: 'abather',
    reciterName: 'أباذر الحلواجي',
    durationLabel: '09:25',
    approxDurationSec: 565,
    audioUrl: 'https://ia800307.us.archive.org/1/items/WarithHalwachi/WarithHalwachi.mp3',
  },
  {
    id: 'audio-warith-basim',
    itemId: 'mafatih-warith',
    title: 'زيارة وارث بصوت باسم الكربلائي',
    reciterId: 'basim',
    reciterName: 'باسم الكربلائي',
    durationLabel: '10:50',
    approxDurationSec: 650,
    audioUrl: 'https://ia801507.us.archive.org/25/items/BasimWarith/BasimWarith.mp3',
  },

  // دعاء الجوشن الكبير
  {
    id: 'audio-jawshan-abather',
    itemId: 'mafatih-jawshan-kabir',
    title: 'دعاء الجوشن الكبير (مائة فقرة)',
    reciterId: 'abather',
    reciterName: 'أباذر الحلواجي',
    durationLabel: '52:10',
    approxDurationSec: 3130,
    audioUrl: 'https://ia801504.us.archive.org/8/items/JawshanHalwachi/JawshanHalwachi.mp3',
  },
  {
    id: 'audio-jawshan-tammar',
    itemId: 'mafatih-jawshan-kabir',
    title: 'دعاء الجوشن الكبير بصوت ميثم التمار',
    reciterId: 'tammar',
    reciterName: 'ميثم التمار',
    durationLabel: '49:30',
    approxDurationSec: 2970,
    audioUrl: 'https://ia801506.us.archive.org/14/items/JawshanMaytham/JawshanMaytham.mp3',
  },

  // دعاء السمات
  {
    id: 'audio-simat-abather',
    itemId: 'mafatih-simat',
    title: 'دعاء السمات لآخر نهار الجمعة',
    reciterId: 'abather',
    reciterName: 'أباذر الحلواجي',
    durationLabel: '17:40',
    approxDurationSec: 1060,
    audioUrl: 'https://ia801505.us.archive.org/13/items/SimatHalwachi/SimatHalwachi.mp3',
  },
  {
    id: 'audio-simat-samavati',
    itemId: 'mafatih-simat',
    title: 'دعاء السمات بصوت مهدي سماواتي',
    reciterId: 'samavati',
    reciterName: 'مهدي سماواتي',
    durationLabel: '19:15',
    approxDurationSec: 1155,
    audioUrl: 'https://ia800302.us.archive.org/19/items/SimatSamavati/SimatSamavati.mp3',
  },

  // دعاء المشلول
  {
    id: 'audio-mashlool-abather',
    itemId: 'mafatih-mashlool',
    title: 'دعاء المشلول المروي عن الإمام علي (ع)',
    reciterId: 'abather',
    reciterName: 'أباذر الحلواجي',
    durationLabel: '21:30',
    approxDurationSec: 1290,
    audioUrl: 'https://ia801500.us.archive.org/17/items/MashloolHalwachi/MashloolHalwachi.mp3',
  },
  {
    id: 'audio-mashlool-samavati',
    itemId: 'mafatih-mashlool',
    title: 'دعاء المشلول بصوت مهدي سماواتي',
    reciterId: 'samavati',
    reciterName: 'مهدي سماواتي',
    durationLabel: '23:05',
    approxDurationSec: 1385,
    audioUrl: 'https://ia801509.us.archive.org/18/items/MashloolSamavati/MashloolSamavati.mp3',
  },

  // زيارة أمين الله
  {
    id: 'audio-amin-abather',
    itemId: 'mafatih-amin-allah',
    title: 'زيارة أمين الله لأمير المؤمنين (ع)',
    reciterId: 'abather',
    reciterName: 'أباذر الحلواجي',
    durationLabel: '07:50',
    approxDurationSec: 470,
    audioUrl: 'https://ia801502.us.archive.org/9/items/AminAllahHalwachi/AminAllahHalwachi.mp3',
  },
  {
    id: 'audio-amin-basim',
    itemId: 'mafatih-amin-allah',
    title: 'زيارة أمين الله بصوت باسم الكربلائي',
    reciterId: 'basim',
    reciterName: 'باسم الكربلائي',
    durationLabel: '08:40',
    approxDurationSec: 520,
    audioUrl: 'https://ia801508.us.archive.org/15/items/BasimAminAllah/BasimAminAllah.mp3',
  },

  // زيارة الجامعة الكبيرة
  {
    id: 'audio-jamiah-abather',
    itemId: 'mafatih-jamiah-kabirah',
    title: 'الزيارة الجامعة الكبيرة للإمام الهادي (ع)',
    reciterId: 'abather',
    reciterName: 'أباذر الحلواجي',
    durationLabel: '29:40',
    approxDurationSec: 1780,
    audioUrl: 'https://ia801505.us.archive.org/29/items/JamiahHalwachi/JamiahHalwachi.mp3',
  },

  // دعاء الافتتاح
  {
    id: 'audio-iftitah-abather',
    itemId: 'mafatih-iftitah',
    title: 'دعاء الافتتاح لليالي شهر رمضان',
    reciterId: 'abather',
    reciterName: 'أباذر الحلواجي',
    durationLabel: '21:15',
    approxDurationSec: 1275,
    audioUrl: 'https://ia801507.us.archive.org/18/items/IftitahHalwachi/IftitahHalwachi.mp3',
  },
  {
    id: 'audio-iftitah-basim',
    itemId: 'mafatih-iftitah',
    title: 'دعاء الافتتاح بصوت باسم الكربلائي',
    reciterId: 'basim',
    reciterName: 'باسم الكربلائي',
    durationLabel: '23:30',
    approxDurationSec: 1410,
    audioUrl: 'https://ia801503.us.archive.org/27/items/BasimIftitah/BasimIftitah.mp3',
  },

  // دعاء أبي حمزة الثمالي
  {
    id: 'audio-abuhamza-samavati',
    itemId: 'mafatih-abu-hamza',
    title: 'دعاء أبي حمزة الثمالي في أسحار رمضان',
    reciterId: 'samavati',
    reciterName: 'مهدي سماواتي',
    durationLabel: '48:20',
    approxDurationSec: 2900,
    audioUrl: 'https://ia801501.us.archive.org/28/items/AbuHamzaSamavati/AbuHamzaSamavati.mp3',
  },
  {
    id: 'audio-abuhamza-abather',
    itemId: 'mafatih-abu-hamza',
    title: 'دعاء أبي حمزة الثمالي بصوت أباذر الحلواجي',
    reciterId: 'abather',
    reciterName: 'أباذر الحلواجي',
    durationLabel: '45:10',
    approxDurationSec: 2710,
    audioUrl: 'https://ia801506.us.archive.org/20/items/AbuHamzaHalwachi/AbuHamzaHalwachi.mp3',
  },

  // دعاء العهد
  {
    id: 'audio-ahd-abather',
    itemId: 'mafatih-ahd',
    title: 'دعاء العهد المروي عن الإمام الصادق (ع)',
    reciterId: 'abather',
    reciterName: 'أباذر الحلواجي',
    durationLabel: '06:50',
    approxDurationSec: 410,
    audioUrl: 'https://ia801504.us.archive.org/19/items/AhdHalwachi/AhdHalwachi.mp3',
  },
  {
    id: 'audio-ahd-basim',
    itemId: 'mafatih-ahd',
    title: 'دعاء العهد بصوت باسم الكربلائي',
    reciterId: 'basim',
    reciterName: 'باسم الكربلائي',
    durationLabel: '07:30',
    approxDurationSec: 450,
    audioUrl: 'https://ia801509.us.archive.org/14/items/BasimAhd/BasimAhd.mp3',
  },

  // مناجاة التائبين
  {
    id: 'audio-taibin-akraf',
    itemId: 'mafatih-munajat-taibin',
    title: 'مناجاة التائبين للإمام زين العابدين (ع)',
    reciterId: 'akraf',
    reciterName: 'حسين الأكرف',
    durationLabel: '08:15',
    approxDurationSec: 495,
    audioUrl: 'https://ia801500.us.archive.org/2/items/AkrafTaibin/AkrafTaibin.mp3',
  },
  {
    id: 'audio-taibin-abather',
    itemId: 'mafatih-munajat-taibin',
    title: 'مناجاة التائبين بصوت أباذر الحلواجي',
    reciterId: 'abather',
    reciterName: 'أباذر الحلواجي',
    durationLabel: '07:40',
    approxDurationSec: 460,
    audioUrl: 'https://ia801508.us.archive.org/7/items/TaibinHalwachi/TaibinHalwachi.mp3',
  },
];

// Helper to get tracks for a specific Mafatih item
export function getTracksForItem(itemId: string): MafatihAudioTrack[] {
  return MAFATIH_AUDIO_TRACKS.filter((t) => t.itemId === itemId);
}

// Built-in content: used the first time the app opens, when offline,
// and to fill the database (see supabase/schema.sql).

export const SONGS = [
  {
    id: 1, position: 1, title_am: 'ፀሎቴ', title_en: 'Tselote · Prayer',
    verse: 'እግዚአብሔርን አንዲት ነገር እለምነዋለሁ፤ እርሷንም እሻለሁ።', reference: 'መዝሙር 27:4',
    youtube_id: 'U38ENoNWv7s',
    lyrics: `ጸሎቴ
የዘውትር ጥማት መሻቴ
የምናፍቀው ስእለቴ
በቤትህ የጀመረልኝ እድሜዬ
እንዲያልቅ ሽምግልናዬ

ዛሬ ውላለው ከእግርህ ስር
አሳልፋለው ጊዜ ከአንተ ጋር……ጸሎቴ.

የማያስተውል ሆኜ ተላላ
አደራ እድሜዬ እንዳይበላ………ጸሎቴ.

አልቸኩልብህ ጊዜ አልጣ
ከመሰውያዬ እንዳልታጣ
እንዲፈራብኝ የመንፈስ ፍሬ
ከአንተ ልጣበቅ ከመምህሬ

እንዳይባክን ይህ እድሜዬ
በግሳንግስ ተታልዬ
ምቀዳብህ ሁነኝ ምንጬ
ልዋል ከእግርህ ተቀምጬ.

እንዳይባክን ይህ እድሜዬ
በከንቱነት ተታልዬ
ምቀዳብህ ሁነኝ ምንጬ
ልዋል ከእግርህ ተቀምጬ.

ጸሎቴ
የዘውትር ጥማት መሻቴ
የምናፍቀው ስእለቴ
በቤትህ የጀመረልኝ እድሜዬ
እንዲያልቅ ሽምግልናዬ

ዛሬ ውላለው ከእግርህ ስር
አሳልፋለው ጊዜ ከአንተ ጋር……ጸሎቴ.

የማያስተውል ሆኜ ተላላ
አደራ እድሜዬ እንዳይበላ………ጸሎቴ.

የልብህ ሃሳብ እንዲሆን ሃሳቤ
ቃልህን ልያዝ ላትም በልቤ
ሳሰላስለው ቀኑን ልዋል
ማታ ልጸልይ በርከክ ልበል

ጉብዝናዬ ምትከብርበት
ያለኝ ጊዜ ምትነግስበት
ወጣትነቴን ውሰደው
አንዳች አይኑር የማስቀረው

ጉብዝናዬ ምትከብርበት
ያለኝ ጊዜ ምትነግስበት
ወጣትነቴን ውሰደው
አንዳች አይኑር የማስቀረው

ጸሎቴ
የዘውትር ጥማት መሻቴ
የምናፍቀው ስእለቴ
በቤትህ የጀመረልኝ እድሜዬ
እንዲያልቅ ሽምግልናዬ

ዛሬ ውላለው ከእግርህ ስር
አሳልፋለው ጊዜ ከአንተ ጋር……ጸሎቴ.

የማያስተውል ሆኜ ተላላ
አደራ እድሜዬ እንዳይበላ………ጸሎቴ.`
  },
  {
    id: 2, position: 2, title_am: 'መንፈስ ቅዱስ', title_en: 'Menfes Kidus · Holy Spirit',
    verse: '', reference: '', youtube_id: 'WS2cKm2MJi4',
    lyrics: `ምሳሳለትን ባጣ እንኳን
ህይወት ቀጣይ ይዘለቃል
ያላንተ ግን ለደቂቃ
እንደማልኖር ልቤ ያውቃል
አሻሃለውኝ ፀንቼ
በሬን ጓዳዬን ዘግቼ
ፈልግሃለው አላቋርጥም
በሌላ ነገር ጥሜ አይቆርጥም
ፍፁም ምረካው የምረሰርስ
ስትነካኝ ነው ባንተ ስዳሰስ

መንፈስ ቅዱስ 3×
በልቤ ጓዳ ተመላለስ እንድታደስ
መንፈስ ቅዱስ 3×
በልቤ ጓዳ ተመላለስ እንድፈወስ
መንፈስ ቅዱስ 3×
በልቤ ጓዳ ተመላለስ እንድታደሰ
እንድፈወስ እንድታደስ 2×`
  },
  {
    id: 3, position: 3, title_am: 'ቃልህ', title_en: 'Kalih · Your Word',
    verse: 'የነጠረ ቃልህ እጅጉን የጠራ፣ ለእግሬ መብራት ሆኖ እኔን እየመራ።', reference: 'መዝሙር 119',
    youtube_id: 'E8RVbxz8WnY',
    lyrics: `የነጠረ ቃልህ እጅጉን የጠራ፣
ለእግሬ መብራት ሆኖ እኔን እየመራ፣
የመንገዴ ብርሃን ይሁን መካሪዬ፣
እንዳልሰናከል ከልካይ ጠባቂዬ.

ምርኮ እንዳለው እጅግ ብዙ፣
ትእዛዛትህን መያዙ፣
ደስታ ሰላም ነውና እረፍት፣
መፈለግ የአንተን ስርአት፣
ይሁን ቃልህ ትዝታዬ፣
ልገኝልህ አስተውዬ.
ነፍሴ ህግህን ትናፍቅ፣
ምስክርህን ለማወቅ.

ከሃጥአን ሳቅ ጨዋታ፣
ከትእቢተኞች ገበታ፣
ከረጋባቸው ልባቸው፣
አመጽ ዉሃ ምግባቸው፣
እኔ ግን በህግህ ልርካ፣
በትእዛዛትህ ልነካ.
ዛሬ ለመልካም ልጨንቅ፣
ስርአትህን ነገ እንዳውቅ.

ለሊት በሆነበት የህይወቴ ምእራፍ፣
በጭንቅ በመከራ በሃዘን እንኳን ባልፍ፣
መጽናናት እረፍቴ የአፍህ ቃል ይሁነኝ፣
በህግህ ደስ ልሰኝ.
ከሁኔታ በላይ ቃልህ ነው ተድላዬ፣
ህግህ ዝማሪዬ.`
  },
  {
    id: 4, position: 4, title_am: 'ልፍራህ ጌታ', title_en: 'Lifrah Geta · Let Me Fear You, Lord',
    verse: 'የጥበብ መጀመሪያ እግዚአብሔርን መፍራት ነው።', reference: 'መዝሙር 111:10',
    youtube_id: 'EFKe-aKmdUU',
    lyrics: `ማነው አስተዋይ ማነው ጠቢብ፣
ያለዉ ጌታውን ሚፈራ ልብ፣
ተሽሮ ሐጥያቱ ቢቆም በፀጋ፣
ምህረት ቀሎበት ማይዘናጋ፣
ማነው ጠቢቡ ማነው ያ ሰው፣
አምላክ እንደልቤ የሚለው፣
የሚያስገዛለት ልቡን በፍርሀት፣
ጌታዬ ብሎ የሚኖርለት።

ልፍራህ ጌታ ላክብርህ፣
እንደቃልህ ልኑርልህ፣
በጓዳዬም በአደባባይ፣
በሕይወቴ ተፈርተህ ታይ።
በድፍረትም በአለማወቅ፣
ከቶ እንዳልስት ልቤን ጠብቅ።

ቢዘረጋልኝ የምህረት እጁ፣
ዓብ ቢታረቀኝ በአንድ ልጁ፣
ከቶ እንዳልኖር በጭንቅ በስጋት፣
ድፍረትን ባገኝ እንድለው አባት፣
ወደኔ እጅግ ቢቀርብ ቢጠጋ፣
አምላክነቱን ከቶ አልዘነጋ።
ጥበብን ልማር ከአባቶቼ፣
እግዚዓብሄርን ልኑር ፈርቼ።

ዛሬም እግዚዓብሄር የጥንቱ፣
ቅድስና ማስፈራቱ፣
ማይመረመር ጥበብ ብርታቱ፣
አያቅልልህ ልቤ ለአፍታ፣
በቀልድ እንኳን በጫወታ፣
ልፍራህ ልገዛልህ ጌታ…`
  },
  {
    id: 5, position: 5, title_am: 'እንደ ኢየሱስ', title_en: 'Ende Eyesus · Like Jesus',
    verse: 'በእርሱ እኖራለሁ የሚል እርሱ እንደ ተመላለሰ ራሱ ደግሞ ሊመላለስ ይገባዋል።', reference: '1 ዮሐንስ 2:6',
    youtube_id: '0kSKe2YVgJo',
    lyrics: ''
  },
  {
    id: 6, position: 6, title_am: 'እሮጣለሁ', title_en: 'Erotalehu · I Will Run',
    verse: 'በኋላዬ ሊመጣ የሚወድ ቢኖር፥ ራሱን ይካድ መስቀሉንም ዕለት ዕለት ተሸክሞ ይከተለኝ።', reference: 'ሉቃስ 9:23',
    youtube_id: '5ej-lo0gLgA',
    lyrics: `አይኔን ከአንተ አላንሳ
ሁሉን ለመተው አልሳሳ
ጌታ እንድከተልህ
እሮጣለሁ ከዃላህ
እሮጣለሁ ከዃላህ

ከፈርኦን ቤት እንጀራ
ከሕዝብህ ጋራ መከራ
ይሻለኛል ብሎ መርጦ
አንተን ከሁሉ አስበልጦ

ከንጉስ ቤት ከድሎቱ
በለጠበት ብድራቱ
የሚታዛዝ ለድምጽህ
ታማኝ ደቀ መዝሙርህ

አይኔን ከአንተ አላንሳ
ሁሉን ለመተው አልሳሳ
ጌታ እንድከተልህ
እሮጣለሁ ከዃላህ
እሮጣለሁ ከዃላህ

በእድሜው ማብቂያ ጎብኝተኸው
ታምነህ ይስሃቅን ሰጥተኸው
ሳይጠግብ እንኳን ስሞት ገና
ሰዋው ብትለው ውጣና

መች ቅር አለው መች አቅማማ
ፍጹም ከቃልህ ተስማማ
ማንም የለም ሚወስድ ብልጫ
ቀዳሚ ነህ አንተ ብቻ

አይኔን ከአንተ አላንሳ
ሁሉን ለመተው አልሳሳ
ጌታ እንድከተልህ
እሮጣለሁ ከዃላህ
እሮጣለሁ ከዃላህ

ስጋ ነግሶ ከበላዬ
እንዳልጎድል ከተስፋዬ
እይዛለሁ መስቀሌን
ልሰቅልበት ትግሌን

ነፍሴን ስላንተ አጠፋለሁ
ግና አንተን አገኛለሁ
አለም ሙሉ አይሁን ትርፌ
ልሙላ ባንተ ተትረፍርፌ

አይኔን ከአንተ አላንሳ
ሁሉን ለመተው አልሳሳ
ጌታ እንድከተልህ
እሮጣለሁ ከዃላህ
እሮጣለሁ ከዃላህ`
  }
];

export const BREAD = [
  { id: 9, posted_on: '2026-10-06', reference: 'ሮሜ 1:3-4', amens: 2, reflection: '', prayer: '',
    verse_text: 'ይህም ወንጌል በሥጋ ከዳዊት ዘር ስለ ተወለደ እንደ ቅድስና መንፈስ ግን ከሙታን መነሣት የተነሣ በኃይል የእግዚአብሔር ልጅ ሆኖ ስለ ተገለጠ ስለ ልጁ ነው፤ እርሱም ጌታችን ኢየሱስ ክርስቶስ ነው።' },
  { id: 8, posted_on: '2026-10-02', reference: '1 ሳሙኤል 2:2', amens: 4, reflection: '', prayer: '',
    verse_text: 'እንደ እግዚአብሔር ቅዱስ የለምና፥ እንደ አምላካችንም ጻድቅ የለምና፤ ከአንተ በቀር ቅዱስ የለም።' },
  { id: 7, posted_on: '2026-10-01', reference: 'ያዕቆብ 3:13-18', amens: 2, reflection: '', prayer: '',
    verse_text: 'ከእናንተ ጥበበኛና አስተዋይ ማን ነው? በመልካም አንዋዋሩ ስራውን በጥበብ የዋህነት ያሳይ። ነገር ግን መራራ ቅንዓትና አድመኛነት በልባችሁ ቢኖርባችሁ፥ አትመኩ በእውነትም ላይ አትዋሹ። ይህ ጥበብ ከላይ የሚወርድ አይደለም፤ ነገር ግን የምድር ነው፥ የሥጋም ነው፥ የአጋንንትም ነው፤ ቅንዓትና አድመኛነት ባሉበት ስፍራ በዚያ ሁከትና ክፉ ስራ ሁሉ አሉና። ላይኛይቱ ጥበብ ግን በመጀመሪያ ንጽሕት ናት፥ በኋላም ታራቂ፥ ገር፥ እሺ ባይ ምሕረትና በጎ ፍሬ የሞላባት፥ ጥርጥርና ግብዝነት የሌለባት ናት። የጽድቅም ፍሬ ሰላምን ለሚያደርጉት ሰዎች በሰላም ይዘራል።' },
  { id: 6, posted_on: '2026-09-30', reference: '1 ጴጥሮስ 1:3-5', amens: 3, reflection: '', prayer: '',
    verse_text: 'ኢየሱስ ክርስቶስ ከሙታን በመነሣቱ ለሕያው ተስፋና ለማይጠፋ፥ እድፈትም ለሌለበት፥ ለማያልፍም ርስት እንደ ምሕረቱ ብዛት ሁለተኛ የወለደን የጌታችን የኢየሱስ ክርስቶስ አምላክና አባት ይባረክ፤ ይህም ርስት በመጨረሻው ዘመን ይገለጥ ዘንድ ለተዘጋጀ መዳን በእምነት በእግዚአብሔር ኃይል ለተጠበቃችሁ ለእናንተ በሰማይ ቀርቶላችኋል።' },
  { id: 5, posted_on: '2026-09-29', reference: 'ራእይ 1:7-8', amens: 3, reflection: '', prayer: '',
    verse_text: 'እነሆ፥ ከደመና ጋር ይመጣል፤ ዓይንም ሁሉ የወጉትም ያዩታል፥ የምድርም ወገኖች ሁሉ ስለ እርሱ ዋይ ዋይ ይላሉ። አዎን፥ አሜን። “ያለውና የነበረው የሚመጣውም ሁሉንም የሚገዛ ጌታ አምላክ፥ አልፋና ዖሜጋ እኔ ነኝ” ይላል።' },
  { id: 4, posted_on: '2026-09-28', reference: 'ዕብራውያን 1:1-3', amens: 5, reflection: '', prayer: '',
    verse_text: 'ከጥንት ጀምሮ እግዚአብሔር በብዙ ዓይነትና በብዙ ጎዳና ለአባቶቻችን በነቢያት ተናግሮ፥ ሁሉን ወራሽ ባደረገው ደግሞም ዓለማትን በፈጠረበት በልጁ በዚህ ዘመን መጨረሻ ለእኛ ተናገረን፤ እርሱም የክብሩ መንጸባረቅና የባሕርዩ ምሳሌ ሆኖ፥ ሁሉን በስልጣኑ ቃል እየደገፈ፥ ኃጢአታችንን በራሱ ካነጻ በኋላ በሰማያት በግርማው ቀኝ ተቀመጠ፤' },
  { id: 3, posted_on: '2026-09-27', reference: '1 ጴጥሮስ 1:3-5', amens: 4, reflection: '', prayer: '',
    verse_text: 'ኢየሱስ ክርስቶስ ከሙታን በመነሣቱ ለሕያው ተስፋና ለማይጠፋ፥ እድፈትም ለሌለበት፥ ለማያልፍም ርስት እንደ ምሕረቱ ብዛት ሁለተኛ የወለደን የጌታችን የኢየሱስ ክርስቶስ አምላክና አባት ይባረክ፤ ይህም ርስት በመጨረሻው ዘመን ይገለጥ ዘንድ ለተዘጋጀ መዳን በእምነት በእግዚአብሔር ኃይል ለተጠበቃችሁ ለእናንተ በሰማይ ቀርቶላችኋል።' },
  { id: 2, posted_on: '2026-09-26', reference: '1 ዮሐንስ 5:1', amens: 7, reflection: '', prayer: '',
    verse_text: 'ክርስቶስ ነው ብሎ በኢየሱስ የሚያምን ሁሉ ከእግዚአብሔር ተወልዶአል፥ ወላጁንም የሚወድ ሁሉ ከእርሱ የተወለደውን ደግሞ ይወዳል።' }
];

export const COMMENTS = [
  { id: 9, name: 'Nanati', created_at: '2026-09-28T12:00:00Z', message: 'Your songs always draw me closer to God, and I’m constantly amazed by how He uses you through every word.your songs have personally made me want to pray more, stay close to Jesus, and hunger for His Word. I truly believe everyone who listens is touched by the Holy Spirit, and that God will use this platform to reach and transform many hearts. I’m beyond blessed to witness it, and I can’t wait for the album.' },
  { id: 8, name: 'Bethel', created_at: '2026-09-27T12:00:00Z', message: 'Every song on this platform carries a powerful message that truly touches the soul and invites the presence of the Holy Spirit. The Daily Bread verses have also become such a daily blessing. I am eagerly looking forward to the new album. Thank you Mnte, for creating this space and for being such a wonderful reflection of his grace.' },
  { id: 7, name: 'Darselam', created_at: '2026-09-26T18:00:00Z', message: 'Your songs always draw me closer to God and inspire me to pray. Every song carries such a deep and powerful message that touches my heart and speaks to my soul. Your music reminds me of God’s love and encourages me to strengthen my faith. Thank you for sharing such beautiful and meaningful songs with us. May God continue to bless you, guide you, and use your gift to touch many more lives. God bless you my brother Mituye ! 🙏❤️' },
  { id: 6, name: 'Becky', created_at: '2026-09-26T15:00:00Z', message: `ኢየሱስን ብቻ እያዩ እርሱን ተከትሎ መሮጥ ከእምነት የሚነሳ መታዘዝን ይጠይቃል። ይህ ደግሞ በውጤቱ እንደ ኢየሱስ መሆንን፥ ከእርሱ ጋር ጥብቅ ወዳጅነትን እና ፈለጉን ተከትሎ መኖርን ይሰጣል።
ወዳጅነቱ ግን አቻ ከመሆን ሳይሆን ከፍቅር የተሰጠ ነው፤ ስለዚህ በፍርሃት እና በመታዘዝ ሊታሰር ግድ ነው።
እግዚአብሔር የፍቅር አምላክ ደግሞም ታላቅ እና የተፈራ አምላክ ነው።

ይህ ሁሉ ይሆን ዘንድ
የነጠረውን እና የጠራውን የእግዚአብሔርን ቃል ወደ ሕይወትን ይመራ ዘንድ የሙጥኝ ማለት፤
ዘወትር በፀጋው ዙፋን ስር በመገኘት በፀሎት መትጋት።

ይህ ነው የክርስትና ጉዞ።

ምንቱዬ እግዚአብሔር አምላክ አብዝቶ ይባርክህ።` },
  { id: 5, name: 'Milkah', created_at: '2026-09-26T12:00:00Z', message: 'May God bless you for giving us this soulful prayer through your beautiful melody.🙌🙌' },
  { id: 4, name: 'Selam', created_at: '2026-09-25T18:00:00Z', message: 'Mntuye Every song you sing feels like a prayer, filled with the presence of the Holy Spirit 🥹❤️ I can’t stop listening all your songs because it always draws me closer to God and inspires me to pray and worship. God is truly using you to touch so many lives. You may be the one singing, but through your voice, God is delivering His message to us. May He continue to use you for His glory 🙌🕊️ Tebarek mntuye' },
  { id: 3, name: 'Hermela', created_at: '2026-09-25T15:00:00Z', message: 'May God be glorified for the grace He has placed within you. All your songs lead us to seek the Holy Spirit, remember His presence, and renew our spirits. May the Lord continue to use you even more. I believe He is preparing you for something much greater. And I can’t wait for the album! ❤️🔥' },
  { id: 2, name: 'Henok G/m', created_at: '2026-09-25T12:00:00Z', message: 'I really loved all the songs. They always draws me into a quiet deep prayer and makes me look beyond the noise searching more sincerely for the ultimate truth and deeper connection with God. They always touch something deep within my soul. They are not just songs but moments of reflection, prayer and spritual awakenings. Thank you Minte and may the Lord bless you even more abundantly! Looking forward for the album 👌' },
  { id: 1, name: 'Nardos', created_at: '2026-09-25T09:00:00Z', message: 'Tebarek 😊' }
];

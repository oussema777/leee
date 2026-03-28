export interface BlogCategory {
  slug: string;
  nameEn: string;
  nameAr: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  excerptEn: string;
  excerptAr: string;
  contentEn: string;
  contentAr: string;
  coverImageUrl: string;
  authorNameEn: string;
  authorNameAr: string;
  authorRole: string;
  authorImageUrl: string;
  categorySlug: string;
  publishedAt: string;
  readTimeMin: number;
  isFeatured?: boolean;
}

export const blogCategories: BlogCategory[] = [
  { slug: "entrepreneurship", nameEn: "Entrepreneurship", nameAr: "ريادة الأعمال" },
  { slug: "impact", nameEn: "Impact Stories", nameAr: "قصص الأثر" },
  { slug: "insights", nameEn: "Insights & Research", nameAr: "رؤى وأبحاث" },
  { slug: "news", nameEn: "News & Updates", nameAr: "أخبار وتحديثات" },
];

export const demoPosts: BlogPost[] = [
  // Featured
  {
    id: "1",
    slug: "green-entrepreneurship-future-lebanon",
    titleEn: "Green Entrepreneurship: The Future of Lebanon's Economy",
    titleAr: "ريادة الأعمال الخضراء: مستقبل الاقتصاد اللبناني",
    excerptEn: "How young Lebanese entrepreneurs are building sustainable businesses that tackle climate change while creating jobs in underserved communities.",
    excerptAr: "كيف يبني رواد الأعمال اللبنانيون الشباب أعمالاً مستدامة تعالج تغير المناخ مع خلق فرص عمل في المجتمعات المحرومة.",
    contentEn: "Lebanon's economic crisis has been one of the most severe in modern history. Yet, amidst the challenges, a new generation of entrepreneurs is emerging — one that sees sustainability not as a luxury, but as the foundation of a resilient economy.\n\nAt LEEE Experience, we've witnessed firsthand how green entrepreneurship can transform communities. Through programs like NAWRA Green Ventures and our LEE Incubators, hundreds of young people are launching businesses that address environmental challenges while generating income.\n\n## The Rise of Green Startups\n\nOver the past three years, we've seen a 300% increase in applications to our green business programs. Entrepreneurs are developing solutions in:\n\n- **Agritech**: Smart irrigation, organic farming, and food processing\n- **Sustainable Fashion**: Upcycled materials, ethical production, and circular economy models\n- **Renewable Energy**: Solar installations, energy efficiency consulting\n- **Waste Management**: Recycling innovations, composting solutions\n\n## Real Impact, Real Numbers\n\nOur green entrepreneurs have collectively:\n- Created over 500 direct jobs\n- Reduced carbon emissions by an estimated 2,000 tons annually\n- Generated $2.5M in combined revenue\n- Served 15,000+ beneficiaries in rural communities\n\n## What's Next?\n\nThe future is bright. With continued support from partners like the EU, ILO, and GIZ, we're scaling our green entrepreneurship programs to reach 5,000 more aspiring entrepreneurs by 2027. The message is clear: sustainability and profitability can — and must — go hand in hand.\n\nIf you're an aspiring green entrepreneur, explore our programs and join the movement.",
    contentAr: "كانت الأزمة الاقتصادية في لبنان واحدة من أشد الأزمات في التاريخ الحديث. ومع ذلك، وسط التحديات، يبرز جيل جديد من رواد الأعمال — جيل يرى الاستدامة ليست ترفاً بل أساساً لاقتصاد مرن.\n\nفي LEEE Experience، شهدنا بشكل مباشر كيف يمكن لريادة الأعمال الخضراء أن تحوّل المجتمعات. من خلال برامج مثل مشاريع نورة الخضراء وحاضنات LEE، يطلق المئات من الشباب أعمالاً تعالج التحديات البيئية مع توليد الدخل.\n\n## صعود الشركات الناشئة الخضراء\n\nعلى مدى السنوات الثلاث الماضية، شهدنا زيادة بنسبة 300% في الطلبات المقدمة لبرامج الأعمال الخضراء.\n\n## أثر حقيقي، أرقام حقيقية\n\nحقق رواد الأعمال الخضراء لدينا مجتمعين:\n- إنشاء أكثر من 500 وظيفة مباشرة\n- تقليل انبعاثات الكربون بنحو 2,000 طن سنوياً\n- توليد 2.5 مليون دولار في الإيرادات المجمعة\n- خدمة أكثر من 15,000 مستفيد في المجتمعات الريفية",
    coverImageUrl: "/images/field-visit-rural.jpg",
    authorNameEn: "Dr. Ali Mansour",
    authorNameAr: "د. علي منصور",
    authorRole: "CEO, LEEE Experience",
    authorImageUrl: "/images/mentoring-session.jpg",
    categorySlug: "entrepreneurship",
    publishedAt: "2026-03-10",
    readTimeMin: 6,
    isFeatured: true,
  },
  {
    id: "2",
    slug: "rima-story-from-idea-to-fashion-brand",
    titleEn: "From an Idea to a Fashion Brand: Rima's Journey with NAWRA",
    titleAr: "من فكرة إلى علامة أزياء: رحلة ريما مع نورة",
    excerptEn: "How Rima Al-Hajj turned her passion for sustainable fashion into a thriving brand that employs 12 women in South Lebanon.",
    excerptAr: "كيف حوّلت ريما الحاج شغفها بالأزياء المستدامة إلى علامة تجارية مزدهرة توظف 12 امرأة في جنوب لبنان.",
    contentEn: "When Rima Al-Hajj first heard about the NAWRA Green Ventures program, she was skeptical. As a single mother in South Lebanon, the idea of starting a green fashion business seemed far-fetched.\n\n\"I had the skills — I'd been sewing since I was 15,\" Rima recalls. \"But I had no idea how to turn that into a real business.\"\n\nThe NAWRA program changed everything. Over six months, Rima received:\n- Business plan development training\n- Financial literacy workshops\n- Mentorship from experienced entrepreneurs\n- $5,000 in seed funding\n- Access to an e-commerce platform\n\n## Building EcoThread\n\nToday, Rima's brand EcoThread produces sustainable fashion using upcycled fabrics sourced from textile waste in Beirut. Her workshop in Houla employs 12 women, each earning above the minimum wage.\n\n\"NAWRA didn't just teach me business,\" she says. \"It gave me a community of women who believe in each other.\"\n\n## The Numbers\n\n- 12 women employed full-time\n- 2,000+ garments produced monthly\n- 90% of materials are upcycled\n- Revenue grew 400% in the first year\n\nRima's story is a testament to what happens when you combine talent with opportunity. Her next goal? Expanding to Beirut and launching an online store targeting the Gulf market.",
    contentAr: "عندما سمعت ريما الحاج لأول مرة عن برنامج مشاريع نورة الخضراء، كانت متشككة. كأم عزباء في جنوب لبنان، بدت فكرة إطلاق عمل أزياء خضراء بعيدة المنال.\n\n\"كانت لدي المهارات — كنت أخيط منذ أن كان عمري 15 عاماً\" تتذكر ريما. \"لكنني لم أكن أعرف كيف أحوّل ذلك إلى عمل حقيقي.\"\n\nغيّر برنامج نورة كل شيء. على مدى ستة أشهر، تلقت ريما تدريباً على تطوير خطة العمل وورش محو الأمية المالية وإرشاداً من رواد أعمال ذوي خبرة و5,000 دولار كتمويل أولي.\n\n## بناء EcoThread\n\nاليوم، تنتج علامة ريما التجارية EcoThread أزياء مستدامة باستخدام أقمشة معاد تدويرها. ورشتها في حولا توظف 12 امرأة.\n\n\"نورة لم تعلمني الأعمال فحسب\" تقول. \"بل أعطتني مجتمعاً من النساء اللواتي يؤمنن ببعضهن البعض.\"",
    coverImageUrl: "/images/nawra-women-training.jpg",
    authorNameEn: "Sara Khoury",
    authorNameAr: "سارة خوري",
    authorRole: "Communications Officer",
    authorImageUrl: "/images/women-empowerment-art.jpg",
    categorySlug: "impact",
    publishedAt: "2026-02-22",
    readTimeMin: 5,
  },
  {
    id: "3",
    slug: "5-lessons-from-siyb-graduates",
    titleEn: "5 Lessons We Learned from 500+ SIYB Graduates",
    titleAr: "5 دروس تعلمناها من أكثر من 500 خريج من SIYB",
    excerptEn: "Key insights and patterns we've observed from training over 500 aspiring entrepreneurs through the ILO-certified SIYB program.",
    excerptAr: "رؤى وأنماط رئيسية لاحظناها من تدريب أكثر من 500 رائد أعمال طموح من خلال برنامج SIYB المعتمد.",
    contentEn: "After graduating over 500 entrepreneurs through the ILO-certified Start & Improve Your Business program, we've gathered invaluable insights about what makes entrepreneurs succeed — and what holds them back.\n\n## Lesson 1: Mindset Before Skills\n\nThe most successful graduates weren't always the most technically skilled. They were the ones who embraced a growth mindset and were willing to pivot when things didn't go as planned.\n\n## Lesson 2: Community is Everything\n\nEntrepreneurs who stayed connected to their cohort after graduation were 3x more likely to still be in business after two years. Peer support isn't optional — it's essential.\n\n## Lesson 3: Financial Literacy is the #1 Gap\n\n78% of applicants had strong business ideas but weak financial planning skills. This led us to double the financial literacy component in our curriculum.\n\n## Lesson 4: Women Outperform on Sustainability\n\nWomen-led businesses in our program had a 40% higher survival rate at the two-year mark. They tended to grow more sustainably and reinvest profits into their communities.\n\n## Lesson 5: Digital Skills are Non-Negotiable\n\nEvery successful graduate in our recent cohorts leveraged digital tools — from social media marketing to e-commerce platforms. We've now integrated digital skills into every training module.\n\nThese lessons continue to shape our program design. We're committed to evolving our approach based on real outcomes, not assumptions.",
    contentAr: "بعد تخريج أكثر من 500 رائد أعمال من خلال برنامج ابدأ وحسّن عملك المعتمد من منظمة العمل الدولية، جمعنا رؤى لا تقدر بثمن حول ما يجعل رواد الأعمال ينجحون — وما يعيقهم.\n\n## الدرس 1: العقلية قبل المهارات\n\nلم يكن الخريجون الأكثر نجاحاً دائماً الأكثر مهارة تقنياً. بل كانوا من تبنوا عقلية النمو.\n\n## الدرس 2: المجتمع هو كل شيء\n\nكان رواد الأعمال الذين بقوا على تواصل مع مجموعتهم بعد التخرج أكثر احتمالاً بثلاث مرات للاستمرار في العمل بعد عامين.\n\n## الدرس 3: محو الأمية المالية هي الفجوة الأولى\n\n78% من المتقدمين كانت لديهم أفكار عمل قوية لكن مهارات تخطيط مالي ضعيفة.\n\n## الدرس 4: النساء يتفوقن في الاستدامة\n\nحققت الأعمال بقيادة النساء معدل بقاء أعلى بنسبة 40%.\n\n## الدرس 5: المهارات الرقمية غير قابلة للتفاوض\n\nكل خريج ناجح في مجموعاتنا الأخيرة استفاد من الأدوات الرقمية.",
    coverImageUrl: "/images/group-training-workshop.jpg",
    authorNameEn: "Hassan Mourad",
    authorNameAr: "حسن مراد",
    authorRole: "Programs Director",
    authorImageUrl: "/images/training-presentation.jpg",
    categorySlug: "insights",
    publishedAt: "2026-02-05",
    readTimeMin: 7,
  },
  {
    id: "4",
    slug: "leee-partnership-eu-enable-programme",
    titleEn: "LEEE Partners with EU on Expanded ENABLE Programme",
    titleAr: "LEEE تشترك مع الاتحاد الأوروبي في برنامج ENABLE الموسّع",
    excerptEn: "New partnership with the European Union extends the ENABLE programme to 3 additional governorates, targeting 1,000 new entrepreneurs.",
    excerptAr: "شراكة جديدة مع الاتحاد الأوروبي تمدد برنامج ENABLE إلى 3 محافظات إضافية، تستهدف 1,000 رائد أعمال جديد.",
    contentEn: "We are thrilled to announce an expanded partnership with the European Union to extend the ENABLE programme across three additional Lebanese governorates: Nabatieh, Baalbek-Hermel, and North Lebanon.\n\nThe expanded programme, funded by the EU and implemented in collaboration with the ILO, will deliver certified SIYB entrepreneurship training to 1,000 new aspiring entrepreneurs over the next 18 months.\n\n## What's New\n\n- **Geographic expansion**: Reaching underserved areas in the south and north\n- **Enhanced digital component**: All participants receive digital marketing training\n- **Green business track**: A dedicated pathway for green entrepreneurs\n- **Mentorship matching**: Every graduate paired with a local business mentor\n\nThis expansion builds on the success of our initial ENABLE implementation, which saw a 85% business creation rate among graduates.\n\n\"LEEE Experience has proven that quality entrepreneurship training can be delivered at scale in challenging contexts,\" said the EU Delegation's Head of Cooperation.",
    contentAr: "يسعدنا الإعلان عن شراكة موسعة مع الاتحاد الأوروبي لتمديد برنامج ENABLE عبر ثلاث محافظات لبنانية إضافية: النبطية وبعلبك الهرمل وشمال لبنان.\n\nسيقدم البرنامج الموسع، الممول من الاتحاد الأوروبي والمنفذ بالتعاون مع منظمة العمل الدولية، تدريب ريادة أعمال SIYB المعتمد لـ 1,000 رائد أعمال طموح جديد خلال الـ 18 شهراً القادمة.\n\n## ما الجديد\n\n- التوسع الجغرافي: الوصول إلى المناطق المحرومة في الجنوب والشمال\n- مكوّن رقمي محسّن: جميع المشاركين يتلقون تدريب تسويق رقمي\n- مسار الأعمال الخضراء: مسار مخصص لرواد الأعمال الخضراء\n- مطابقة الإرشاد: كل خريج يُربط بمرشد أعمال محلي",
    coverImageUrl: "/images/team-partners-meeting.jpg",
    authorNameEn: "LEEE Communications",
    authorNameAr: "اتصالات LEEE",
    authorRole: "Official",
    authorImageUrl: "/images/international-professionals.jpg",
    categorySlug: "news",
    publishedAt: "2026-01-18",
    readTimeMin: 4,
  },
  {
    id: "5",
    slug: "women-economic-empowerment-mena",
    titleEn: "Women's Economic Empowerment: What Works in MENA",
    titleAr: "التمكين الاقتصادي للمرأة: ما ينجح في منطقة الشرق الأوسط",
    excerptEn: "Evidence-based insights from our programs on what truly drives women's economic participation in the MENA region.",
    excerptAr: "رؤى مبنية على الأدلة من برامجنا حول ما يدفع حقاً المشاركة الاقتصادية للمرأة في المنطقة.",
    contentEn: "Women's economic empowerment remains one of the most impactful interventions for community development. Based on data from our NAWRA, SIYB, and Houla programs, here's what we've learned about what actually works.\n\n## Holistic Support, Not Just Training\n\nPrograms that combine skills training with access to finance, mentorship, and market linkages see 3x better outcomes than training-only interventions.\n\n## Childcare is Infrastructure\n\nWhen we provided childcare during training sessions, women's attendance increased by 60% and completion rates rose to 95%.\n\n## Peer Networks Drive Sustainability\n\nWomen who formed peer support groups after our programs had significantly higher business survival rates. We now facilitate WhatsApp communities for every cohort.\n\n## Digital Access is a Game-Changer\n\nWomen who received smartphones and data packages alongside digital skills training were 4x more likely to establish an online sales presence.\n\nThese findings continue to inform our program design and our advocacy with policymakers.",
    contentAr: "يبقى التمكين الاقتصادي للمرأة من أكثر التدخلات تأثيراً في التنمية المجتمعية. بناءً على بيانات من برامج نورة وSIYB وحولا، إليكم ما تعلمناه.\n\n## الدعم الشامل وليس التدريب فقط\n\nالبرامج التي تجمع التدريب على المهارات مع الوصول إلى التمويل والإرشاد وروابط السوق تحقق نتائج أفضل بثلاث مرات.\n\n## رعاية الأطفال هي بنية تحتية\n\nعندما وفرنا رعاية الأطفال خلال جلسات التدريب، زاد حضور النساء بنسبة 60%.\n\n## شبكات الأقران تدفع الاستدامة\n\nالنساء اللواتي شكّلن مجموعات دعم الأقران بعد برامجنا حققن معدلات بقاء أعمال أعلى بشكل ملحوظ.\n\n## الوصول الرقمي يغيّر قواعد اللعبة\n\nالنساء اللواتي تلقين هواتف ذكية وباقات بيانات مع تدريب مهارات رقمية كنّ أكثر احتمالاً 4 مرات لإنشاء حضور مبيعات عبر الإنترنت.",
    coverImageUrl: "/images/women-empowerment-art.jpg",
    authorNameEn: "Dr. Nadia Salim",
    authorNameAr: "د. نادية سليم",
    authorRole: "Research & Policy Lead",
    authorImageUrl: "/images/nawra-dream-to-jury.jpg",
    categorySlug: "insights",
    publishedAt: "2025-12-12",
    readTimeMin: 6,
  },
  {
    id: "6",
    slug: "houla-factory-one-year-milestone",
    titleEn: "Houla Green Fashion Factory Celebrates One-Year Milestone",
    titleAr: "مصنع حولا للأزياء الخضراء يحتفل بمرور عام",
    excerptEn: "The women-led sewing factory in South Lebanon marks its first anniversary with 50 employed women and 24,000 garments produced.",
    excerptAr: "مصنع الخياطة بقيادة النساء في جنوب لبنان يحتفل بالذكرى السنوية الأولى مع توظيف 50 امرأة وإنتاج 24,000 قطعة.",
    contentEn: "One year ago, the Houla Women's Green Fashion Factory opened its doors in South Lebanon. Today, we celebrate a remarkable milestone.\n\n## By the Numbers\n\n- **50 women** employed full-time with above-minimum-wage salaries\n- **24,000 garments** produced using sustainable methods\n- **85% of materials** sourced from upcycled textiles\n- **$180,000** in revenue generated\n- **3 international buyers** secured for export\n\n## Beyond Employment\n\nThe factory isn't just about jobs. It's a community hub offering:\n- E-commerce training for online sales\n- Leadership development workshops\n- Financial literacy sessions\n- Psychosocial support programs\n\nPartner UNIFIL's CIMIC office has been instrumental in supporting infrastructure development and community liaison.\n\n\"This factory represents what women can achieve when given the right tools and support,\" says factory manager Nour Bazzi.",
    contentAr: "قبل عام، فتح مصنع حولا للأزياء الخضراء للنساء أبوابه في جنوب لبنان. اليوم، نحتفل بإنجاز رائع.\n\n## بالأرقام\n\n- 50 امرأة موظفة بدوام كامل برواتب أعلى من الحد الأدنى\n- 24,000 قطعة ملابس أُنتجت بأساليب مستدامة\n- 85% من المواد مصدرها أقمشة معاد تدويرها\n- 180,000 دولار إيرادات\n- 3 مشترين دوليين للتصدير\n\n## ما وراء التوظيف\n\nالمصنع ليس مجرد وظائف. إنه مركز مجتمعي يقدم تدريب التجارة الإلكترونية وورش تطوير القيادة وجلسات محو الأمية المالية وبرامج الدعم النفسي الاجتماعي.",
    coverImageUrl: "/images/handcrafted-products.jpg",
    authorNameEn: "Sara Khoury",
    authorNameAr: "سارة خوري",
    authorRole: "Communications Officer",
    authorImageUrl: "/images/women-empowerment-art.jpg",
    categorySlug: "impact",
    publishedAt: "2025-11-20",
    readTimeMin: 4,
  },
  {
    id: "7",
    slug: "digital-transformation-rural-entrepreneurs",
    titleEn: "How Digital Transformation is Reaching Rural Entrepreneurs",
    titleAr: "كيف يصل التحول الرقمي إلى رواد الأعمال في الريف",
    excerptEn: "Our Digital Media Hub is bridging the digital divide for entrepreneurs in Lebanon's most underserved rural communities.",
    excerptAr: "مركز الإعلام الرقمي لدينا يسد الفجوة الرقمية لرواد الأعمال في أكثر المجتمعات الريفية حرماناً في لبنان.",
    contentEn: "Digital literacy is no longer optional for entrepreneurs — it's the foundation of modern business. Yet in rural Lebanon, access to digital tools and training remains severely limited.\n\nOur Digital Media Hub initiative is changing that. Over the past year, we've delivered digital skills training to 800+ entrepreneurs in rural areas across Akkar, Bekaa, and South Lebanon.\n\n## The Program\n\n- 5-day intensive digital bootcamps\n- Topics: social media marketing, e-commerce, digital payments, online branding\n- Devices provided: tablets with pre-loaded business tools\n- Follow-up mentoring for 3 months after training\n\n## Results\n\n- 65% of participants launched a social media presence within 30 days\n- 40% started selling products online\n- Average income increase of 25% within 6 months\n\nThe digital divide is real — but it's not insurmountable.",
    contentAr: "لم تعد المعرفة الرقمية اختيارية لرواد الأعمال — إنها أساس الأعمال الحديثة. ومع ذلك، في ريف لبنان، يبقى الوصول إلى الأدوات والتدريب الرقمي محدوداً بشدة.\n\nمبادرة مركز الإعلام الرقمي لدينا تغيّر ذلك. خلال العام الماضي، قدمنا تدريب مهارات رقمية لأكثر من 800 رائد أعمال في المناطق الريفية.\n\n## البرنامج\n\n- معسكرات رقمية مكثفة لمدة 5 أيام\n- المواضيع: التسويق عبر وسائل التواصل، التجارة الإلكترونية، المدفوعات الرقمية\n- أجهزة مقدمة: أجهزة لوحية مع أدوات أعمال محمّلة مسبقاً\n\n## النتائج\n\n- 65% من المشاركين أطلقوا حضوراً على وسائل التواصل خلال 30 يوماً\n- 40% بدأوا بيع المنتجات عبر الإنترنت\n- زيادة متوسطة في الدخل بنسبة 25% خلال 6 أشهر",
    coverImageUrl: "/images/training-presentation.jpg",
    authorNameEn: "Ahmad Kassem",
    authorNameAr: "أحمد قاسم",
    authorRole: "Digital Hub Manager",
    authorImageUrl: "/images/mentoring-session.jpg",
    categorySlug: "entrepreneurship",
    publishedAt: "2025-10-08",
    readTimeMin: 5,
  },
  {
    id: "8",
    slug: "youth-summit-2025-recap",
    titleEn: "Youth Entrepreneurship Summit 2025: A Recap",
    titleAr: "قمة ريادة الأعمال للشباب 2025: ملخص",
    excerptEn: "Over 400 young entrepreneurs gathered in Beirut for two days of panels, pitch competitions, and networking at our annual summit.",
    excerptAr: "تجمع أكثر من 400 رائد أعمال شاب في بيروت ليومين من الحلقات النقاشية ومسابقات العروض والتواصل في قمتنا السنوية.",
    contentEn: "The 2025 Youth Entrepreneurship Summit brought together over 400 aspiring entrepreneurs, investors, and changemakers from across the MENA region.\n\n## Highlights\n\n- **12 panel discussions** covering topics from green tech to social enterprise\n- **Pitch competition**: 20 startups competed, with 3 winners sharing $50,000 in seed funding\n- **Networking sessions**: Over 200 one-on-one meetings facilitated\n- **Keynote**: Minister of Economy addressed the opening ceremony\n\n## Pitch Competition Winners\n\n1. **GreenRoute** — Last-mile delivery using electric vehicles ($25,000)\n2. **AgroSense** — IoT sensors for precision agriculture ($15,000)\n3. **ReThread** — Textile waste recycling platform ($10,000)\n\nThe energy in the room was electric. Planning for the 2026 summit is already underway — join us.",
    contentAr: "جمعت قمة ريادة الأعمال للشباب 2025 أكثر من 400 رائد أعمال طموح ومستثمر وصانع تغيير من جميع أنحاء منطقة الشرق الأوسط.\n\n## أبرز اللحظات\n\n- 12 حلقة نقاش تغطي مواضيع من التكنولوجيا الخضراء إلى المؤسسات الاجتماعية\n- مسابقة العروض: تنافست 20 شركة ناشئة، مع 3 فائزين يتقاسمون 50,000 دولار كتمويل أولي\n- جلسات التواصل: أكثر من 200 اجتماع فردي\n\n## الفائزون بمسابقة العروض\n\n1. GreenRoute — توصيل الميل الأخير بالمركبات الكهربائية (25,000 دولار)\n2. AgroSense — مستشعرات إنترنت الأشياء للزراعة الدقيقة (15,000 دولار)\n3. ReThread — منصة إعادة تدوير نفايات المنسوجات (10,000 دولار)",
    coverImageUrl: "/images/international-professionals.jpg",
    authorNameEn: "LEEE Communications",
    authorNameAr: "اتصالات LEEE",
    authorRole: "Official",
    authorImageUrl: "/images/international-professionals.jpg",
    categorySlug: "news",
    publishedAt: "2025-09-30",
    readTimeMin: 4,
  },
  {
    id: "9",
    slug: "community-kitchens-social-cohesion",
    titleEn: "Community Kitchens: More Than Meals — Building Social Cohesion",
    titleAr: "المطابخ المجتمعية: أكثر من وجبات — بناء التماسك الاجتماعي",
    excerptEn: "How our community kitchen program in Chouf and Bekaa is strengthening bonds between host communities and displaced families.",
    excerptAr: "كيف يعزز برنامج المطابخ المجتمعية في الشوف والبقاع الروابط بين المجتمعات المضيفة والعائلات النازحة.",
    contentEn: "Food has always been a bridge between cultures. Our community kitchen program, supported by GIZ and International Alert, leverages this simple truth to build social cohesion in Lebanon's most diverse communities.\n\n## The Model\n\nEach kitchen serves as:\n- A meal distribution center for vulnerable families\n- A vocational training hub for food preparation skills\n- A psychosocial support space\n- A meeting point for host and displaced communities\n\n## Impact in Numbers\n\n- 2 active kitchens (Chouf + Bekaa)\n- 500+ meals served daily\n- 120 women trained in food safety and preparation\n- 85% of participants report improved relationships with neighbors from different backgrounds\n\nThe community kitchen isn't just about feeding people — it's about nourishing hope.",
    contentAr: "لطالما كان الطعام جسراً بين الثقافات. برنامج المطابخ المجتمعية لدينا، بدعم من GIZ و International Alert، يستفيد من هذه الحقيقة البسيطة لبناء التماسك الاجتماعي.\n\n## النموذج\n\nكل مطبخ يعمل كـ:\n- مركز توزيع وجبات للعائلات الضعيفة\n- مركز تدريب مهني على مهارات إعداد الطعام\n- مساحة دعم نفسي اجتماعي\n- نقطة التقاء للمجتمعات المضيفة والنازحة\n\n## الأثر بالأرقام\n\n- مطبخان نشطان (الشوف + البقاع)\n- أكثر من 500 وجبة يومياً\n- 120 امرأة تدربن على سلامة الغذاء وإعداده\n- 85% من المشاركين يُبلغون عن تحسن العلاقات مع الجيران من خلفيات مختلفة",
    coverImageUrl: "/images/women-group-certificates.jpg",
    authorNameEn: "Fatima Darwish",
    authorNameAr: "فاطمة درويش",
    authorRole: "Community Programs Manager",
    authorImageUrl: "/images/women-group-certificates.jpg",
    categorySlug: "impact",
    publishedAt: "2025-08-15",
    readTimeMin: 5,
  },
];

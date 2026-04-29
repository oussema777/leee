export interface TimelineItem {
  year: number;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  imageUrl: string;
}

export interface TeamMember {
  id: string;
  nameEn: string;
  nameAr: string;
  roleEn: string;
  roleAr: string;
  quoteEn: string;
  quoteAr: string;
  imageUrl: string;
}

export interface CoreValue {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  storyEn: string;
  storyAr: string;
  sdgNumber: number;
  icon: string;
}

export interface StrategyCard {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  targetMetric: string;
  icon: string;
}

export interface OfferingItem {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: string;
}

export const offerings: OfferingItem[] = [
  {
    id: "1",
    titleEn: "Business Incubation",
    titleAr: "حاضنات الأعمال",
    descriptionEn: "End-to-end support from idea to market for early-stage entrepreneurs.",
    descriptionAr: "دعم شامل من الفكرة إلى السوق لرواد الأعمال الناشئين.",
    icon: "rocket",
  },
  {
    id: "2",
    titleEn: "Training & Coaching",
    titleAr: "التدريب والإرشاد",
    descriptionEn: "SIYB-certified training and one-on-one coaching for sustainable business growth.",
    descriptionAr: "تدريب معتمد وإرشاد فردي لنمو مستدام.",
    icon: "graduation-cap",
  },
  {
    id: "3",
    titleEn: "Green Economy",
    titleAr: "الاقتصاد الأخضر",
    descriptionEn: "Climate-smart programs building resilient, environmentally conscious ventures.",
    descriptionAr: "برامج ذكية مناخياً لبناء مشاريع مرنة وصديقة للبيئة.",
    icon: "leaf",
  },
  {
    id: "4",
    titleEn: "Market Access",
    titleAr: "الوصول للأسواق",
    descriptionEn: "Connecting entrepreneurs to local and global markets through Zowada platform.",
    descriptionAr: "ربط رواد الأعمال بالأسواق المحلية والعالمية عبر منصة زوادة.",
    icon: "globe",
  },
  {
    id: "5",
    titleEn: "Funding & Finance",
    titleAr: "التمويل",
    descriptionEn: "Seed funding, grants, and financial literacy to de-risk entrepreneurial growth.",
    descriptionAr: "تمويل أولي ومنح ومحو أمية مالية لدعم النمو.",
    icon: "coins",
  },
  {
    id: "6",
    titleEn: "Community Building",
    titleAr: "بناء المجتمع",
    descriptionEn: "Events, networking, and peer support connecting changemakers across MENA.",
    descriptionAr: "فعاليات وتشبيك ودعم أقران يربط صناع التغيير.",
    icon: "users",
  },
];

export const timelineData: TimelineItem[] = [
  {
    year: 2020,
    titleEn: "Birth in the Storm",
    titleAr: "الولادة في العاصفة",
    descriptionEn: "Born in Lebanon during its perfect storm of crises. We saw brilliant minds held back by broken systems and built a bridge between humanitarian urgency and entrepreneurial ambition.",
    descriptionAr: "ولدت في لبنان خلال عاصفة الأزمات. رأينا عقولاً لامعة يعيقها نظام معطل فبنينا جسراً بين الحاجة الإنسانية والطموح الريادي.",
    imageUrl: "/images/new/group-photo.jpg",
  },
  {
    year: 2021,
    titleEn: "Planting Roots",
    titleAr: "غرس الجذور",
    descriptionEn: "Established core programs in Lebanon — incubation, training, and business coaching for women and youth in crisis-affected communities.",
    descriptionAr: "أنشأنا البرامج الأساسية في لبنان — الحاضنة والتدريب والإرشاد للنساء والشباب.",
    imageUrl: "/images/new/coaching-session.jpg",
  },
  {
    year: 2022,
    titleEn: "Regional Reach",
    titleAr: "الوصول الإقليمي",
    descriptionEn: "Expanded to 10 countries across MENA and Africa. Launched Zowada digital accelerator. Partnered with ILO, EU, UNIFIL.",
    descriptionAr: "توسعنا إلى 10 دول في منطقة الشرق الأوسط وأفريقيا. أطلقنا مسرّعة زوادة الرقمية.",
    imageUrl: "/images/new/intl-professionals.jpg",
  },
  {
    year: 2023,
    titleEn: "Deepening Impact",
    titleAr: "تعميق الأثر",
    descriptionEn: "Crossed 20,000 beneficiaries. Scaled SIYB-certified training. Launched community kitchens serving 24,000+ meals.",
    descriptionAr: "تجاوزنا 20,000 مستفيد. وسّعنا التدريب المعتمد. أطلقنا مطابخ مجتمعية.",
    imageUrl: "/images/new/community-table.jpg",
  },
  {
    year: 2024,
    titleEn: "Innovation & Scale",
    titleAr: "الابتكار والتوسع",
    descriptionEn: "Pioneered digital learning across 6 MENA countries. Mobilized $1.06M in seed funding. 60% of green ventures thriving post-crisis.",
    descriptionAr: "ريادة التعلم الرقمي في 6 دول. جمعنا 1.06 مليون دولار تمويل أولي.",
    imageUrl: "/images/new/stage-group.jpg",
  },
  {
    year: 2025,
    titleEn: "Five Years Forward",
    titleAr: "خمس سنوات للأمام",
    descriptionEn: "32 strategic projects implemented. 38,790+ lives touched. Operating in 10 countries. A movement, not just an organization.",
    descriptionAr: "32 مشروعاً استراتيجياً. أكثر من 38,790 حياة تأثرت. نعمل في 10 دول.",
    imageUrl: "/images/new/award-winner.jpg",
  },
];

export const teamMembers: TeamMember[] = [
  {
    id: "1",
    nameEn: "Rana",
    nameAr: "رنا",
    roleEn: "Bekaa Hub Lead",
    roleAr: "مديرة مركز البقاع",
    quoteEn: "I grew up here. I know what works.",
    quoteAr: "نشأت هنا. أعرف ما ينجح.",
    imageUrl: "/images/new/mena-women.jpg",
  },
  {
    id: "2",
    nameEn: "Karim",
    nameAr: "كريم",
    roleEn: "Digital Lead",
    roleAr: "المدير الرقمي",
    quoteEn: "Offline-first isn't a feature—it's respect.",
    quoteAr: "العمل بدون إنترنت ليس ميزة—إنه احترام.",
    imageUrl: "/images/new/workshop-notes.jpg",
  },
  {
    id: "3",
    nameEn: "Nour",
    nameAr: "نور",
    roleEn: "Programs Director",
    roleAr: "مديرة البرامج",
    quoteEn: "We don't deliver projects. We deliver pathways.",
    quoteAr: "لا نقدم مشاريع. نقدم مسارات.",
    imageUrl: "/images/new/women-thumbsup.jpg",
  },
  {
    id: "4",
    nameEn: "Ahmad",
    nameAr: "أحمد",
    roleEn: "Impact & M&E Lead",
    roleAr: "مسؤول الأثر والمتابعة",
    quoteEn: "Every dollar must earn its place. We measure what matters.",
    quoteAr: "كل دولار يجب أن يستحق مكانه. نقيس ما يهم.",
    imageUrl: "/images/new/hands-on-work.jpg",
  },
  {
    id: "5",
    nameEn: "Lama",
    nameAr: "لمى",
    roleEn: "Academy Coordinator",
    roleAr: "منسقة الأكاديمية",
    quoteEn: "Skills that stick. Knowledge that transforms.",
    quoteAr: "مهارات تبقى. معرفة تحول.",
    imageUrl: "/images/new/classroom.jpg",
  },
  {
    id: "6",
    nameEn: "Sara",
    nameAr: "سارة",
    roleEn: "Partnerships Manager",
    roleAr: "مديرة الشراكات",
    quoteEn: "No one wins alone. We connect, collaborate, and co-create.",
    quoteAr: "لا أحد يفوز وحده. نتواصل ونتعاون ونبتكر معاً.",
    imageUrl: "/images/new/pitch-winner.jpg",
  },
];

export const coreValues: CoreValue[] = [
  {
    id: "1",
    nameEn: "Inclusion First",
    nameAr: "الشمولية أولاً",
    descriptionEn: "We design with those left behind—not for them.",
    descriptionAr: "نصمم مع المهمشين—لا من أجلهم.",
    storyEn: "When we designed the Zowada app, we tested it with women in Baalbek with 2G phones. If it didn't work for them, it didn't launch.",
    storyAr: "عندما صممنا تطبيق زوادة، اختبرناه مع نساء في بعلبك يستخدمن هواتف 2G.",
    sdgNumber: 10,
    icon: "users",
  },
  {
    id: "2",
    nameEn: "Resilience & Ownership",
    nameAr: "المرونة والملكية",
    descriptionEn: "We build self-reliance, not dependency. Our goal is to work ourselves out of a job.",
    descriptionAr: "نبني الاعتماد على الذات، لا التبعية.",
    storyEn: "We don't give grants. We co-invest. Because ownership changes everything.",
    storyAr: "لا نقدم منحاً. نستثمر معاً. لأن الملكية تغير كل شيء.",
    sdgNumber: 8,
    icon: "shield",
  },
  {
    id: "3",
    nameEn: "Impact Integrity",
    nameAr: "نزاهة الأثر",
    descriptionEn: "Every dollar, every hour, every word must earn its place.",
    descriptionAr: "كل دولار وكل ساعة يجب أن تستحق مكانها.",
    storyEn: "We share our wins and our lessons—because transparency drives trust and trust drives impact.",
    storyAr: "نشارك نجاحاتنا ودروسنا—لأن الشفافية تبني الثقة.",
    sdgNumber: 17,
    icon: "target",
  },
  {
    id: "4",
    nameEn: "Human-Centered Growth",
    nameAr: "النمو المتمحور حول الإنسان",
    descriptionEn: "People aren't 'beneficiaries'. They're protagonists.",
    descriptionAr: "الناس ليسوا 'مستفيدين'. إنهم أبطال.",
    storyEn: "Every program begins with listening. We design around lived realities, not theoretical frameworks.",
    storyAr: "كل برنامج يبدأ بالاستماع. نصمم حول الواقع المعاش.",
    sdgNumber: 1,
    icon: "heart",
  },
  {
    id: "5",
    nameEn: "Equity & Access",
    nameAr: "المساواة والوصول",
    descriptionEn: "Barriers aren't inevitable—they're design flaws. We fix the design.",
    descriptionAr: "العوائق ليست حتمية—إنها عيوب تصميم. نحن نصلح التصميم.",
    storyEn: "80% of our supported entrepreneurs are women. That's not a target—it's a reflection of who drives change.",
    storyAr: "80% من رواد الأعمال الذين ندعمهم من النساء.",
    sdgNumber: 5,
    icon: "scale",
  },
  {
    id: "6",
    nameEn: "Sustainable Innovation",
    nameAr: "الابتكار المستدام",
    descriptionEn: "We future-proof, not just patch. Green isn't a theme—it's the foundation.",
    descriptionAr: "نحصّن المستقبل، لا نرقّع فقط. الأخضر ليس شعاراً—إنه الأساس.",
    storyEn: "60% of our green ventures still thrive post-crisis. That's not luck—it's design.",
    storyAr: "60% من مشاريعنا الخضراء لا تزال تزدهر بعد الأزمة.",
    sdgNumber: 13,
    icon: "leaf",
  },
  {
    id: "7",
    nameEn: "Ecosystem Thinking",
    nameAr: "التفكير المنظومي",
    descriptionEn: "No one wins alone. We connect, collaborate, and co-create.",
    descriptionAr: "لا أحد يفوز وحده. نتواصل ونتعاون ونبتكر معاً.",
    storyEn: "We co-organize GITS to bring capital to communities, connecting local entrepreneurs with global investors.",
    storyAr: "ننظم GITS لجلب رأس المال للمجتمعات المحلية.",
    sdgNumber: 17,
    icon: "network",
  },
];

export const strategyCards: StrategyCard[] = [
  {
    id: "1",
    titleEn: "Scale Impact with a Green & Gender Lens",
    titleAr: "توسيع الأثر بعدسة خضراء وجندرية",
    descriptionEn: "Cultivate a $5M+ portfolio of green-focused projects. Directly support 25,000+ women with green skills, services, and climate finance.",
    descriptionAr: "تنمية محفظة بقيمة 5 مليون دولار+ من المشاريع الخضراء.",
    targetMetric: "$5M+ portfolio, 25K+ women",
    icon: "trending-up",
  },
  {
    id: "2",
    titleEn: "Build a Robust Ecosystem for Women-Led Green Ventures",
    titleAr: "بناء منظومة قوية للمشاريع الخضراء بقيادة نسائية",
    descriptionEn: "Strengthen 3,000+ women-led MSMEs in agritech, renewable energy, and circular economy.",
    descriptionAr: "تعزيز 3,000+ مشروع صغير بقيادة نسائية في الزراعة والطاقة المتجددة.",
    targetMetric: "3,000+ women-led MSMEs",
    icon: "sprout",
  },
  {
    id: "3",
    titleEn: "Innovate Financing for Sustainability",
    titleAr: "ابتكار التمويل من أجل الاستدامة",
    descriptionEn: "Scale Cash-for-Work models to de-risk green business growth. Digitize presence to attract global donors.",
    descriptionAr: "توسيع نماذج النقد مقابل العمل لدعم نمو الأعمال الخضراء.",
    targetMetric: "Digital-first financing",
    icon: "coins",
  },
  {
    id: "4",
    titleEn: "Deliver Holistic, Human-Centered Support",
    titleAr: "تقديم دعم شامل متمحور حول الإنسان",
    descriptionEn: "Bundle services: incubation, climate-smart training, sustainable finance, and market access.",
    descriptionAr: "دمج الخدمات: الحاضنة والتدريب المناخي والتمويل المستدام.",
    targetMetric: "Bundled services model",
    icon: "hand-heart",
  },
];

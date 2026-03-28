export interface TestimonialCategory {
  slug: string;
  nameEn: string;
  nameAr: string;
}

export interface TestimonialItem {
  id: string;
  nameEn: string;
  nameAr: string;
  roleEn: string;
  roleAr: string;
  quoteEn: string;
  quoteAr: string;
  imageUrl: string;
  programEn: string;
  programAr: string;
  categorySlug: string;
  year: number;
}

export const testimonialCategories: TestimonialCategory[] = [
  { slug: "entrepreneurs", nameEn: "Entrepreneurs", nameAr: "رواد الأعمال" },
  { slug: "women", nameEn: "Women Leaders", nameAr: "القيادات النسائية" },
  { slug: "community", nameEn: "Community Members", nameAr: "أفراد المجتمع" },
  { slug: "partners", nameEn: "Partners & Donors", nameAr: "الشركاء والمانحون" },
];

export const demoTestimonials: TestimonialItem[] = [
  // Entrepreneurs
  {
    id: "1",
    nameEn: "Ahmad Kassem",
    nameAr: "أحمد قاسم",
    roleEn: "Founder, GreenBite Catering",
    roleAr: "مؤسس، GreenBite للتموين",
    quoteEn: "The SIYB training gave me the tools to turn my passion for cooking into a real business. Today, my community kitchen serves 200 families daily in the Bekaa Valley. LEEE didn't just teach me business — they believed in me when no one else did.",
    quoteAr: "منحني تدريب SIYB الأدوات لتحويل شغفي بالطبخ إلى عمل حقيقي. اليوم، مطبخي المجتمعي يخدم 200 عائلة يومياً في سهل البقاع. LEEE لم تعلمني الأعمال فحسب — بل آمنوا بي عندما لم يؤمن بي أحد.",
    imageUrl: "/images/mentoring-session.jpg",
    programEn: "SIYB Training Program",
    programAr: "برنامج تدريب SIYB",
    categorySlug: "entrepreneurs",
    year: 2025,
  },
  {
    id: "2",
    nameEn: "Hassan Mourad",
    nameAr: "حسن مراد",
    roleEn: "Co-founder, AgriTech Solutions",
    roleAr: "شريك مؤسس، حلول التكنولوجيا الزراعية",
    quoteEn: "Through the LEE Incubators program, we received mentoring, seed funding, and access to a network of investors. Our agritech startup now supports over 300 smallholder farmers with smart irrigation solutions.",
    quoteAr: "من خلال برنامج حاضنات LEE، حصلنا على إرشاد وتمويل أولي ووصول إلى شبكة مستثمرين. شركتنا الناشئة في التكنولوجيا الزراعية تدعم الآن أكثر من 300 مزارع صغير بحلول الري الذكي.",
    imageUrl: "/images/field-visit-rural.jpg",
    programEn: "LEE Incubators",
    programAr: "حاضنات LEE",
    categorySlug: "entrepreneurs",
    year: 2024,
  },
  {
    id: "3",
    nameEn: "Karim Haddad",
    nameAr: "كريم حداد",
    roleEn: "Owner, Karim's Digital Studio",
    roleAr: "مالك، استوديو كريم الرقمي",
    quoteEn: "The digital marketing bootcamp was a game-changer. I learned social media strategy, branding, and analytics in just two days. Within three months, my client base tripled.",
    quoteAr: "كان معسكر التسويق الرقمي نقطة تحول. تعلمت استراتيجية وسائل التواصل الاجتماعي والعلامة التجارية والتحليلات في يومين فقط. خلال ثلاثة أشهر، تضاعف عدد عملائي ثلاث مرات.",
    imageUrl: "/images/training-presentation.jpg",
    programEn: "Digital Media Hub",
    programAr: "مركز الإعلام الرقمي",
    categorySlug: "entrepreneurs",
    year: 2025,
  },

  // Women Leaders
  {
    id: "4",
    nameEn: "Rima Al-Hajj",
    nameAr: "ريما الحاج",
    roleEn: "Founder, EcoThread Fashion",
    roleAr: "مؤسسة، أزياء EcoThread",
    quoteEn: "NAWRA transformed my life. As a woman in South Lebanon, starting a green fashion business seemed impossible. The program gave me training, funding, and — most importantly — a community of women who lift each other up. We now employ 12 women.",
    quoteAr: "غيّر برنامج نورة حياتي. كامرأة في جنوب لبنان، بدا إطلاق عمل أزياء خضراء مستحيلاً. منحني البرنامج التدريب والتمويل — والأهم — مجتمعاً من النساء اللواتي يدعمن بعضهن. نوظف الآن 12 امرأة.",
    imageUrl: "/images/nawra-women-training.jpg",
    programEn: "NAWRA Green Ventures",
    programAr: "مشاريع نورة الخضراء",
    categorySlug: "women",
    year: 2025,
  },
  {
    id: "5",
    nameEn: "Nour Bazzi",
    nameAr: "نور بزي",
    roleEn: "Manager, Houla Sewing Cooperative",
    roleAr: "مديرة، تعاونية حولا للخياطة",
    quoteEn: "The Houla factory gave us more than jobs — it gave us dignity. I went from being unemployed to managing a cooperative of 50 women producing sustainable fashion. LEEE and UNIFIL made this dream a reality.",
    quoteAr: "أعطانا مصنع حولا أكثر من وظائف — أعطانا كرامة. انتقلت من البطالة إلى إدارة تعاونية من 50 امرأة تنتج أزياء مستدامة. جعلت LEEE واليونيفيل هذا الحلم حقيقة.",
    imageUrl: "/images/handcrafted-products.jpg",
    programEn: "Houla Green Fashion Factory",
    programAr: "مصنع حولا للأزياء الخضراء",
    categorySlug: "women",
    year: 2024,
  },
  {
    id: "6",
    nameEn: "Layla Khoury",
    nameAr: "ليلى خوري",
    roleEn: "Entrepreneur, Organic Skincare",
    roleAr: "رائدة أعمال، العناية بالبشرة العضوية",
    quoteEn: "The Women in Leadership workshop in Tripoli changed how I see myself. I learned negotiation, financial planning, and how to pitch my organic skincare brand to investors. I closed my first funding round two months later.",
    quoteAr: "غيّرت ورشة القيادة النسائية في طرابلس نظرتي لنفسي. تعلمت التفاوض والتخطيط المالي وكيفية عرض علامتي التجارية للعناية بالبشرة العضوية على المستثمرين. أغلقت جولة التمويل الأولى بعد شهرين.",
    imageUrl: "/images/women-empowerment-art.jpg",
    programEn: "Women in Leadership Workshop",
    programAr: "ورشة القيادة النسائية",
    categorySlug: "women",
    year: 2025,
  },

  // Community Members
  {
    id: "7",
    nameEn: "Fatima Darwish",
    nameAr: "فاطمة درويش",
    roleEn: "Community Kitchen Volunteer, Chouf",
    roleAr: "متطوعة في المطبخ المجتمعي، الشوف",
    quoteEn: "The community kitchen in Chouf is more than a place to eat — it's where we heal. After being displaced, I found community, learned new skills, and regained hope. The psychosocial support sessions were life-changing.",
    quoteAr: "المطبخ المجتمعي في الشوف أكثر من مكان للأكل — إنه حيث نتعافى. بعد النزوح، وجدت مجتمعاً وتعلمت مهارات جديدة واستعدت الأمل. جلسات الدعم النفسي الاجتماعي غيّرت حياتي.",
    imageUrl: "/images/women-group-certificates.jpg",
    programEn: "Community Resilience Program",
    programAr: "برنامج صمود المجتمع",
    categorySlug: "community",
    year: 2024,
  },
  {
    id: "8",
    nameEn: "Omar Suleiman",
    nameAr: "عمر سليمان",
    roleEn: "Farmer, Bekaa Valley",
    roleAr: "مزارع، سهل البقاع",
    quoteEn: "The agritech webinars taught me modern farming techniques I never knew existed. My crop yield increased by 40% after implementing the drip irrigation methods they recommended. Knowledge is truly the best investment.",
    quoteAr: "علمتني ندوات التكنولوجيا الزراعية تقنيات زراعة حديثة لم أكن أعلم بوجودها. زاد محصولي بنسبة 40% بعد تطبيق أساليب الري بالتنقيط التي أوصوا بها. المعرفة هي حقاً أفضل استثمار.",
    imageUrl: "/images/field-visit-rural.jpg",
    programEn: "Agritech Innovation Program",
    programAr: "برنامج ابتكار التكنولوجيا الزراعية",
    categorySlug: "community",
    year: 2024,
  },
  {
    id: "9",
    nameEn: "Sara Itani",
    nameAr: "سارة عيتاني",
    roleEn: "Youth Participant, Beirut",
    roleAr: "مشاركة شبابية، بيروت",
    quoteEn: "Attending the Youth Entrepreneurship Summit opened doors I didn't know existed. I connected with mentors, learned about green business models, and won third place in the pitch competition. That $10,000 seed fund launched my startup.",
    quoteAr: "فتح حضور قمة ريادة الأعمال للشباب أبواباً لم أكن أعلم بوجودها. تواصلت مع مرشدين وتعلمت عن نماذج الأعمال الخضراء وفزت بالمركز الثالث في مسابقة العروض. صندوق الـ 10,000 دولار أطلق شركتي الناشئة.",
    imageUrl: "/images/international-professionals.jpg",
    programEn: "Youth Entrepreneurship Summit",
    programAr: "قمة ريادة الأعمال للشباب",
    categorySlug: "community",
    year: 2025,
  },

  // Partners & Donors
  {
    id: "10",
    nameEn: "Dr. Maria Santos",
    nameAr: "د. ماريا سانتوس",
    roleEn: "Program Manager, ILO Regional Office",
    roleAr: "مديرة برامج، المكتب الإقليمي لمنظمة العمل الدولية",
    quoteEn: "LEEE Experience is one of our most effective implementing partners in the region. Their SIYB delivery is consistently high-quality, and their reach into underserved communities is unmatched. The ENABLE program results exceeded all our targets.",
    quoteAr: "LEEE Experience هي واحدة من أكثر شركائنا المنفذين فعالية في المنطقة. تقديمهم لبرنامج SIYB عالي الجودة باستمرار ووصولهم إلى المجتمعات المحرومة لا مثيل له. نتائج برنامج ENABLE تجاوزت جميع أهدافنا.",
    imageUrl: "/images/team-partners-meeting.jpg",
    programEn: "ENABLE / SIYB Partnership",
    programAr: "شراكة ENABLE / SIYB",
    categorySlug: "partners",
    year: 2025,
  },
  {
    id: "11",
    nameEn: "Jean-Pierre Dubois",
    nameAr: "جان بيير دوبوا",
    roleEn: "Head of Cooperation, EU Delegation to Lebanon",
    roleAr: "رئيس التعاون، بعثة الاتحاد الأوروبي في لبنان",
    quoteEn: "The EU's partnership with LEEE on the ENABLE programme has been exemplary. Their ability to deliver certified entrepreneurship training at scale while maintaining quality and inclusivity is remarkable.",
    quoteAr: "شراكة الاتحاد الأوروبي مع LEEE في برنامج ENABLE كانت نموذجية. قدرتهم على تقديم تدريب ريادة أعمال معتمد على نطاق واسع مع الحفاظ على الجودة والشمولية أمر رائع.",
    imageUrl: "/images/outdoor-certificate-ceremony.jpg",
    programEn: "ENABLE Programme",
    programAr: "برنامج ENABLE",
    categorySlug: "partners",
    year: 2024,
  },
  {
    id: "12",
    nameEn: "Col. Andrea Ferretti",
    nameAr: "العقيد أندريا فيريتي",
    roleEn: "CIMIC Officer, UNIFIL",
    roleAr: "ضابط التعاون المدني العسكري، اليونيفيل",
    quoteEn: "Our collaboration with LEEE on the Houla sewing factory demonstrates what's possible when international organizations and local NGOs work together. The impact on women's livelihoods in South Lebanon has been transformative.",
    quoteAr: "تعاوننا مع LEEE في مصنع حولا للخياطة يُظهر ما هو ممكن عندما تعمل المنظمات الدولية والمنظمات المحلية معاً. الأثر على سبل عيش النساء في جنوب لبنان كان تحويلياً.",
    imageUrl: "/images/certificate-presentation.jpg",
    programEn: "Houla Factory / UNIFIL Partnership",
    programAr: "شراكة مصنع حولا / اليونيفيل",
    categorySlug: "partners",
    year: 2023,
  },
];

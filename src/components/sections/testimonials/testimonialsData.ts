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
  /** If true, imageUrl is a full designed testimonial card — render as image only */
  isOriginalCard?: boolean;
}

export const testimonialCategories: TestimonialCategory[] = [
  { slug: "entrepreneurs", nameEn: "Entrepreneurs", nameAr: "رواد الأعمال" },
  { slug: "women", nameEn: "Women Leaders", nameAr: "القيادات النسائية" },
  { slug: "community", nameEn: "Community Members", nameAr: "أفراد المجتمع" },
  { slug: "partners", nameEn: "Trusted By", nameAr: "موثوق من قبل" },
];

export const demoTestimonials: TestimonialItem[] = [
  // ── Women Leaders (REAL — from UNIFIL program) ──
  {
    id: "1",
    nameEn: "Ahrar Qotaish",
    nameAr: "أحرار قطيش",
    roleEn: "Participant, Women's Empowerment Program — Houla",
    roleAr: "مشاركة في مشروع دعم فرص العمل والتمكين الاقتصادي للنساء في حولا",
    quoteEn: "My confidence grew after the training and I felt that the challenges of the economic crisis became easier, especially after we learned sewing, financial literacy, and marketing. I didn't know about these fields before — the trainers helped us so much. Special thanks to UNIFIL, The LEE Experience, and 'Mothers of Houla' for this amazing experience.",
    quoteAr: "ثقتي بنفسي زادت بعد الدورة وحسيت انّو تحديات الازمة الاقتصادية صارو اسهل، خصوصًا بعد ما تعلّمنا على الخياطة والتعليم المالي والتسويق. ما كنت اعرف بهالمجالات، ساعدونا كتير المدربين. شكر خاص لليونيفيل، وذا لي اكسبيرينس، و\"أمهات حولة\" على هاي التجربة المميزة يلّي شاركنا فيها.",
    imageUrl: "/images/testimonials/testimonial-ahrar-fb.jpg",
    programEn: "UNIFIL Women's Economic Empowerment",
    programAr: "مشروع دعم فرص العمل والتمكين الاقتصادي — اليونيفيل",
    categorySlug: "women",
    year: 2022,
    isOriginalCard: true,
  },
  {
    id: "2",
    nameEn: "Salima Mustafa",
    nameAr: "سليما مصطفى",
    roleEn: "Participant, Women's Empowerment Program — Houla",
    roleAr: "مشاركة في مشروع دعم فرص العمل والتمكين الاقتصادي للنساء في حولا",
    quoteEn: "After the long lockdown and the difficult economic situation, I was very eager to join the program. The training was successful, especially because the trainers were committed and engaging. I thank The LEE Experience team for being so cooperative with us, and special thanks to UNIFIL who visited our workshops and motivated us even more.",
    quoteAr: "بعد فترة الحجر الطويلة والوضع الاقتصادي الصعب يلّي نحنا في، كنت متحمسة كتير للانضمام للنشاط. التدريب كان ناجح وخصوصا انّو المتدربين كانوا ملتزمين وعم يتفاعلوا مع العمل. بشكر فريق ذا لي اكسبيرينس يلي كان كتير متعاون معنا. بشكرهم جميعا، و شكر خاص لليونيفيل يلّي زارونا وزاروا المشغل تبعنا وحمّسونا اكتر على الشغل.",
    imageUrl: "/images/testimonials/testimonial-salima-fb.jpg",
    programEn: "UNIFIL Women's Economic Empowerment",
    programAr: "مشروع دعم فرص العمل والتمكين الاقتصادي — اليونيفيل",
    categorySlug: "women",
    year: 2022,
    isOriginalCard: true,
  },
  {
    id: "3",
    nameEn: "Sekna Sakeen",
    nameAr: "سكنة سكين",
    roleEn: "Participant, Women's Empowerment Program — Houla",
    roleAr: "مشاركة في مشروع دعم فرص العمل والتمكين الاقتصادي للنساء في حولا",
    quoteEn: "The training taught us so many things that help us earn more income for our families. We learned sewing, business management, finances, and marketing. We benefited greatly from the training with the 'Mothers of Houla' and The LEE Experience team. Thank you UNIFIL — we're very grateful.",
    quoteAr: "علمتنا الدورة اشيا كتير بتخلينا نأمّن مدخول اكتر لعيلتنا. تعلمنا عن الخياطة، ادارة شغلنا واموالنا، التسويق. استفدنا كتير من التدريب مع فريق \"أمهات حول او\"ذا لي اكسبيرينس\" و \"اليونيفيل\" مشكورين كتير.",
    imageUrl: "/images/testimonials/testimonial-sekna-fb.jpg",
    programEn: "UNIFIL Women's Economic Empowerment",
    programAr: "مشروع دعم فرص العمل والتمكين الاقتصادي — اليونيفيل",
    categorySlug: "women",
    year: 2022,
    isOriginalCard: true,
  },

  // ── Entrepreneurs (from PSDP & video testimonials) ──
  {
    id: "4",
    nameEn: "Stephan El Mur",
    nameAr: "ستيفان المر",
    roleEn: "Founder, Alchemist",
    roleAr: "مؤسس، Alchemist",
    quoteEn: "The PSDP program gave me the structure and mentorship I needed to transform Alchemist from a concept into a thriving business. The hands-on support and market access were invaluable.",
    quoteAr: "منحني برنامج PSDP الهيكلية والإرشاد اللذين احتجتهما لتحويل Alchemist من فكرة إلى مشروع ناجح. الدعم العملي والوصول إلى الأسواق كانا لا يُقدّران بثمن.",
    imageUrl: "/images/new/coaching-session.jpg",
    programEn: "PSDP — Gender-Sensitive Business Support",
    programAr: "PSDP — دعم الأعمال المراعي للنوع الاجتماعي",
    categorySlug: "entrepreneurs",
    year: 2023,
  },
  {
    id: "5",
    nameEn: "Kawthar Alawa",
    nameAr: "كوثر علوة",
    roleEn: "Founder, Equilibre",
    roleAr: "مؤسسة، Equilibre",
    quoteEn: "The Women Do Business Experience program empowered me with the confidence and skills to build Equilibre. From business planning to the pitch competition, every step pushed me to grow as an entrepreneur.",
    quoteAr: "برنامج تجربة سيدات الأعمال مكّنني من الثقة والمهارات لبناء Equilibre. من تخطيط الأعمال إلى مسابقة العروض، كل خطوة دفعتني للنمو كرائدة أعمال.",
    imageUrl: "/images/new/pitch-winner.jpg",
    programEn: "PSDP — Women Do Business Experience",
    programAr: "PSDP — تجربة سيدات الأعمال",
    categorySlug: "entrepreneurs",
    year: 2023,
  },
  {
    id: "6",
    nameEn: "Viviane Philip",
    nameAr: "فيفيان فيليب",
    roleEn: "Entrepreneur",
    roleAr: "رائدة أعمال",
    quoteEn: "Pitching my business idea in front of a jury was terrifying, but the training I received gave me the skills to present with confidence. The experience opened doors I never imagined possible.",
    quoteAr: "تقديم فكرة مشروعي أمام لجنة تحكيم كان مخيفاً، لكن التدريب الذي تلقّيته منحني المهارات للتقديم بثقة. التجربة فتحت أبواباً لم أكن أتخيلها.",
    imageUrl: "/images/new/mena-women.jpg",
    programEn: "My First Business",
    programAr: "هيدا مشروعي",
    categorySlug: "entrepreneurs",
    year: 2022,
  },

  // ── Community Members ──
  {
    id: "7",
    nameEn: "Fatima Darwish",
    nameAr: "فاطمة درويش",
    roleEn: "Community Kitchen Volunteer, Chouf",
    roleAr: "متطوعة في المطبخ المجتمعي، الشوف",
    quoteEn: "The community kitchen in Chouf is more than a place to eat — it's where we heal. After being displaced, I found community, learned new skills, and regained hope. The psychosocial support sessions were life-changing.",
    quoteAr: "المطبخ المجتمعي في الشوف أكثر من مكان للأكل — إنه حيث نتعافى. بعد النزوح، وجدت مجتمعاً وتعلمت مهارات جديدة واستعدت الأمل. جلسات الدعم النفسي الاجتماعي غيّرت حياتي.",
    imageUrl: "/images/new/hands-on-work.jpg",
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
    quoteEn: "The Prospects program taught me modern farming techniques I never knew existed. My crop yield increased significantly after implementing the methods they recommended. Knowledge is truly the best investment.",
    quoteAr: "علمني برنامج Prospects تقنيات زراعة حديثة لم أكن أعلم بوجودها. زاد محصولي بشكل كبير بعد تطبيق الأساليب التي أوصوا بها. المعرفة هي حقاً أفضل استثمار.",
    imageUrl: "/images/new/greenhouse-visit.jpg",
    programEn: "Prospects — Agriculture & Entrepreneurship",
    programAr: "Prospects — الزراعة وريادة الأعمال",
    categorySlug: "community",
    year: 2021,
  },
  {
    id: "9",
    nameEn: "Sara Itani",
    nameAr: "سارة عيتاني",
    roleEn: "Youth Participant, Beirut",
    roleAr: "مشاركة شبابية، بيروت",
    quoteEn: "Attending the GITS Summit opened doors I didn't know existed. I connected with entrepreneurs from across Africa and MENA, learned about green business models, and built partnerships that are still going strong today.",
    quoteAr: "حضور قمة GITS فتح أبواباً لم أكن أعلم بوجودها. تواصلت مع رواد أعمال من أفريقيا والشرق الأوسط، وتعلمت عن نماذج الأعمال الخضراء، وبنيت شراكات لا تزال قائمة حتى اليوم.",
    imageUrl: "/images/projects/gits-6.jpg",
    programEn: "GITS — Global Investment & Trade Summit",
    programAr: "GITS — القمة العالمية للاستثمار والتجارة",
    categorySlug: "community",
    year: 2025,
  },

  // ── Partners & Donors ──
  {
    id: "10",
    nameEn: "International Labour Organization",
    nameAr: "منظمة العمل الدولية",
    roleEn: "UN Agency Partner",
    roleAr: "شريك أممي",
    quoteEn: "LEE Experience is one of our most effective implementing partners in the region. Their SIYB delivery is consistently high-quality, and their reach into underserved communities is unmatched. The ENABLE program results exceeded all our targets.",
    quoteAr: "LEE Experience هي واحدة من أكثر شركائنا المنفذين فعالية في المنطقة. تقديمهم لبرنامج SIYB عالي الجودة باستمرار ووصولهم إلى المجتمعات المحرومة لا مثيل له.",
    imageUrl: "/images/projects/ilo-1.jpg",
    programEn: "ENABLE / SIYB Partnership",
    programAr: "شراكة ENABLE / SIYB",
    categorySlug: "partners",
    year: 2024,
  },
  {
    id: "11",
    nameEn: "UNIFIL",
    nameAr: "اليونيفيل",
    roleEn: "United Nations Interim Force in Lebanon",
    roleAr: "قوة الأمم المتحدة المؤقتة في لبنان",
    quoteEn: "Our collaboration with LEE on the Houla sewing factory demonstrates what's possible when international organizations and local NGOs work together. The impact on women's livelihoods in South Lebanon has been transformative.",
    quoteAr: "تعاوننا مع LEE في مصنع حولا للخياطة يُظهر ما هو ممكن عندما تعمل المنظمات الدولية والمنظمات المحلية معاً. الأثر على سبل عيش النساء في جنوب لبنان كان تحويلياً.",
    imageUrl: "/images/projects/unifil-1.jpg",
    programEn: "Houla Factory / UNIFIL Partnership",
    programAr: "شراكة مصنع حولا / اليونيفيل",
    categorySlug: "partners",
    year: 2022,
  },
  {
    id: "12",
    nameEn: "CAWTAR & Kvinna till Kvinna",
    nameAr: "CAWTAR و Kvinna till Kvinna",
    roleEn: "Regional Partners — Women's Empowerment",
    roleAr: "شركاء إقليميون — تمكين المرأة",
    quoteEn: "The partnership with LEE Experience across six MENA countries has been instrumental in empowering women entrepreneurs with equal access to business and trade markets. Their on-the-ground expertise makes the difference.",
    quoteAr: "كانت الشراكة مع LEE Experience عبر ست دول في منطقة الشرق الأوسط وشمال أفريقيا حاسمة في تمكين رائدات الأعمال من الوصول المتكافئ إلى أسواق الأعمال والتجارة.",
    imageUrl: "/images/projects/cawtar-1.jpg",
    programEn: "Empowering Women Entrepreneurs — MENA",
    programAr: "تمكين رائدات الأعمال — الشرق الأوسط وشمال أفريقيا",
    categorySlug: "partners",
    year: 2023,
  },
];

export interface PathwayCard {
  id: string;
  slug: string;
  icon: string;
  promptEn: string;
  promptAr: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  href: string;
}

export interface PathwayStep {
  stepNumber: number;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
}

export interface PartnerOption {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  exampleEn: string;
  exampleAr: string;
}

export const pathways: PathwayCard[] = [
  {
    id: "1",
    slug: "entrepreneur",
    icon: "lightbulb",
    promptEn: "I have an idea",
    promptAr: "لدي فكرة",
    titleEn: "For Entrepreneurs",
    titleAr: "لرواد الأعمال",
    descriptionEn:
      "Got a green business idea? We'll help you validate, build, and fund it.",
    descriptionAr: "لديك فكرة مشروع أخضر؟ سنساعدك على التحقق منها وبنائها وتمويلها.",
    href: "/get-involved/entrepreneur",
  },
  {
    id: "2",
    slug: "partner",
    icon: "handshake",
    promptEn: "I fund impact",
    promptAr: "أموّل الأثر",
    titleEn: "For Partners & Donors",
    titleAr: "للشركاء والمانحين",
    descriptionEn:
      "Co-create green, gender-responsive programs. Invest in women-led climate innovation.",
    descriptionAr: "شارك في إنشاء برامج خضراء ومستجيبة للنوع الاجتماعي. استثمر في الابتكار المناخي بقيادة النساء.",
    href: "/get-involved/partner",
  },
  {
    id: "3",
    slug: "expert",
    icon: "brain",
    promptEn: "I have skills to share",
    promptAr: "لدي مهارات لمشاركتها",
    titleEn: "For Experts & Mentors",
    titleAr: "للخبراء والمرشدين",
    descriptionEn:
      "Join our pool of trainers, coaches, and mentors. Share your skills through Time Banking or pro-bono consulting.",
    descriptionAr: "انضم إلى فريق المدربين والمدربين والمرشدين لدينا. شارك مهاراتك من خلال بنك الوقت أو الاستشارات المجانية.",
    href: "/get-involved/expert",
  },
  {
    id: "4",
    slug: "advocate",
    icon: "megaphone",
    promptEn: "I believe in this mission",
    promptAr: "أؤمن بهذه المهمة",
    titleEn: "For Advocates",
    titleAr: "للمناصرين",
    descriptionEn:
      "Amplify our success stories and champion women-led green innovation in your network.",
    descriptionAr: "ضخّم قصص نجاحنا وادعم الابتكار الأخضر بقيادة النساء في شبكتك.",
    href: "/get-involved/advocate",
  },
];

export const entrepreneurSteps: PathwayStep[] = [
  {
    stepNumber: 1,
    titleEn: "Take the Eligibility Quiz",
    titleAr: "أجب على اختبار الأهلية",
    descriptionEn:
      "A quick 2-minute assessment to match you with the right program.",
    descriptionAr: "تقييم سريع لمدة دقيقتين لمطابقتك مع البرنامج المناسب.",
  },
  {
    stepNumber: 2,
    titleEn: "Join an Idea Lab",
    titleAr: "انضم لمختبر الأفكار",
    descriptionEn:
      "Free virtual or in-person workshops to validate and refine your concept.",
    descriptionAr: "ورش عمل مجانية افتراضية أو حضورية للتحقق من فكرتك وتحسينها.",
  },
  {
    stepNumber: 3,
    titleEn: "Apply to Our Incubator",
    titleAr: "قدّم للحاضنة",
    descriptionEn:
      "Enter the Green Seeds Incubator or SIYB Green Pathway for full support.",
    descriptionAr: "ادخل حاضنة البذور الخضراء أو مسار SIYB الأخضر للحصول على الدعم الكامل.",
  },
];

export const partnerOptions: PartnerOption[] = [
  {
    id: "1",
    titleEn: "Fund a Pillar",
    titleAr: "موّل ركيزة",
    descriptionEn: "Sponsor programs under any of our 5 strategic pillars.",
    descriptionAr: "رعاية البرامج ضمن أي من ركائزنا الاستراتيجية الخمس.",
    exampleEn: "Sponsor 100 women in SIYB Green",
    exampleAr: "رعاية 100 امرأة في SIYB الأخضر",
  },
  {
    id: "2",
    titleEn: "Co-Design a Program",
    titleAr: "شارك في تصميم برنامج",
    descriptionEn:
      "Work with us to create custom programs for your impact goals.",
    descriptionAr: "اعمل معنا لإنشاء برامج مخصصة لأهداف تأثيرك.",
    exampleEn: "Green Skills for Youth in Jordan",
    exampleAr: "مهارات خضراء للشباب في الأردن",
  },
  {
    id: "3",
    titleEn: "License Our Methodology",
    titleAr: "رخّص منهجيتنا",
    descriptionEn:
      "Use our proven curricula, training frameworks, and M&E systems.",
    descriptionAr: "استخدم مناهجنا المجربة وأطر التدريب وأنظمة الرصد والتقييم.",
    exampleEn: "SIYB-certified training for your region",
    exampleAr: "تدريب معتمد من SIYB لمنطقتك",
  },
];

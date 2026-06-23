/**
 * Adds the "Most Impactful Women Leaders of 2026" announcement blog post.
 * Idempotent: upserts by slug, safe to re-run.
 *
 * Run: node scripts/add-tradeflock-blog-post.mjs
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SLUG = "executive-director-recognized-most-impactful-women-leaders-2026";

const TRADEFLOCK_URL =
  "https://tradeflock.com/magazine/most-impactful-women-leaders-from-asia-2026/#flipbook-df_58237/33/";

const bodyEn = [
  "The LEE Experience is proud to announce that its Executive Director, Manal Hassoun, has been recognized among the Most Impactful Women Leaders of 2026 by TradeFlock.",
  "",
  "This prestigious recognition highlights exceptional women leaders who have demonstrated outstanding dedication, innovation, and commitment to creating meaningful change within their communities and sectors.",
  "",
  `![Manal Hassoun featured in TradeFlock's Most Impactful Women Leaders from Asia 2026](/images/blog/tradeflock-interview-spread.jpg)`,
  "",
  "## A Vision for Inclusive Development",
  "",
  "Throughout her professional journey, Manal Hassoun has championed initiatives that empower women and youth, promote social cohesion, strengthen economic opportunities, and support sustainable community development. Under her leadership, The LEE Experience has expanded its impact through a wide range of programs focused on leadership, entrepreneurship, employability, peacebuilding, and humanitarian response.",
  "",
  "The feature showcases her vision for inclusive development and her belief in the power of local leadership to drive sustainable change. It also reflects the collective efforts of the entire LEE team, partners, beneficiaries, and communities who contribute to the organization's mission every day.",
  "",
  `"We believe that meaningful impact is achieved through collaboration, innovation, and a commitment to empowering individuals and communities to reach their full potential," said Manal Hassoun.`,
  "",
  "## A Milestone for The LEE Experience",
  "",
  "This recognition serves as an important milestone for The LEE Experience and reinforces its continued commitment to supporting women, youth, and vulnerable communities across Lebanon.",
  "",
  "We extend our sincere gratitude to TradeFlock for this recognition and congratulate Manal Hassoun on this well-deserved achievement.",
  "",
  `For more information and to read the full feature, visit the [official TradeFlock publication](${TRADEFLOCK_URL}).`,
].join("\n");

const bodyAr = [
  "تفخر The LEE Experience بالإعلان عن اختيار مديرتها التنفيذية منال حسون ضمن أكثر القيادات النسائية تأثيراً لعام 2026 من قبل مجلة TradeFlock.",
  "",
  "يسلّط هذا التكريم المرموق الضوء على القيادات النسائية الاستثنائية اللواتي أظهرن تفانياً وابتكاراً والتزاماً متميزاً في إحداث تغيير ذي معنى داخل مجتمعاتهن وقطاعاتهن.",
  "",
  "![منال حسون ضمن قائمة TradeFlock لأكثر القيادات النسائية تأثيراً من آسيا 2026](/images/blog/tradeflock-interview-spread.jpg)",
  "",
  "## رؤية للتنمية الشاملة",
  "",
  "على مدى مسيرتها المهنية، قادت منال حسون مبادرات تُمكّن النساء والشباب، وتعزّز التماسك الاجتماعي، وتقوّي الفرص الاقتصادية، وتدعم التنمية المجتمعية المستدامة. وتحت قيادتها، وسّعت The LEE Experience أثرها من خلال مجموعة واسعة من البرامج التي تركّز على القيادة وريادة الأعمال والقابلية للتوظيف وبناء السلام والاستجابة الإنسانية.",
  "",
  "يُبرز هذا التكريم رؤيتها للتنمية الشاملة وإيمانها بقدرة القيادة المحلية على إحداث تغيير مستدام. كما يعكس الجهود الجماعية لفريق LEE بأكمله وللشركاء والمستفيدين والمجتمعات الذين يساهمون في رسالة المؤسسة كل يوم.",
  "",
  "«نؤمن بأن الأثر الحقيقي يتحقق من خلال التعاون والابتكار والالتزام بتمكين الأفراد والمجتمعات للوصول إلى كامل إمكاناتهم»، قالت منال حسون.",
  "",
  "## محطة بارزة لـ The LEE Experience",
  "",
  "يمثّل هذا التكريم محطة مهمة لـ The LEE Experience ويعزّز التزامها المستمر بدعم النساء والشباب والمجتمعات الأكثر هشاشة في مختلف أنحاء لبنان.",
  "",
  "نتقدّم بخالص الشكر لمجلة TradeFlock على هذا التكريم، ونهنّئ منال حسون على هذا الإنجاز المستحق.",
  "",
  `لمزيد من المعلومات ولقراءة المقال الكامل، تفضلوا بزيارة [المنشور الرسمي لمجلة TradeFlock](${TRADEFLOCK_URL}).`,
].join("\n");

const data = {
  titleEn:
    "The LEE Experience Executive Director Recognized Among the Most Impactful Women Leaders of 2026",
  titleAr:
    "المديرة التنفيذية لـ The LEE Experience ضمن أكثر القيادات النسائية تأثيراً لعام 2026",
  summaryEn:
    "The LEE Experience is proud to announce that its Executive Director, Manal Hassoun, has been recognized among the Most Impactful Women Leaders of 2026 by TradeFlock — a milestone celebrating her vision for inclusive development across Lebanon.",
  summaryAr:
    "تفخر The LEE Experience بالإعلان عن اختيار مديرتها التنفيذية منال حسون ضمن أكثر القيادات النسائية تأثيراً لعام 2026 من قبل مجلة TradeFlock — محطة تحتفي برؤيتها للتنمية الشاملة في لبنان.",
  bodyEn,
  bodyAr,
  coverImageUrl: "/images/blog/tradeflock-feature-hero.jpg",
  authorName: "The LEE Experience",
  authorNameAr: "The LEE Experience",
  authorRole: "Official Announcement",
  authorImageUrl: "/images/blog/manal-hassoun-avatar.jpg",
  readTimeMin: 3,
  isFeatured: true,
  category: "news",
  isPublished: true,
  publishedAt: new Date("2026-06-23"),
};

async function main() {
  const post = await prisma.blogPost.upsert({
    where: { slug: SLUG },
    update: data,
    create: { slug: SLUG, ...data },
  });
  console.log(`✓ Blog post upserted: ${post.slug} (id: ${post.id})`);
  console.log(`  URL: /media/blog/${post.slug}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

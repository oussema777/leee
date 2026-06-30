import { describe, it, expect } from "vitest";
import { buildBoardMemberData } from "./mapping";

const sub = {
  name: "Sara", title: "Partnerships Manager", locale: "en" as const,
  photoUrl: "/img/sara.jpg", linkedinUrl: "https://linkedin.com/in/sara",
  twitterUrl: null, instagramUrl: null, websiteUrl: null,
};

describe("buildBoardMemberData", () => {
  it("submitted EN + admin AR fills both languages", () => {
    const d = buildBoardMemberData(sub, { name: "سارة", title: "مديرة الشراكات" }, 5);
    expect(d).toMatchObject({
      nameEn: "Sara", nameAr: "سارة",
      titleEn: "Partnerships Manager", titleAr: "مديرة الشراكات",
      imageUrl: "/img/sara.jpg", linkedinUrl: "https://linkedin.com/in/sara",
      memberType: "TEAM", isActive: true, order: 6,
    });
  });
  it("submitted AR + admin EN mirrors correctly", () => {
    const arSub = { ...sub, name: "سارة", title: "مديرة الشراكات", locale: "ar" as const };
    const d = buildBoardMemberData(arSub, { name: "Sara", title: "Partnerships Manager" }, 0);
    expect(d).toMatchObject({ nameEn: "Sara", nameAr: "سارة", order: 1 });
  });
  it("blank second language leaves the other side empty (render falls back)", () => {
    const d = buildBoardMemberData(sub, { name: "", title: "" }, 0);
    expect(d.nameAr).toBe("");
    expect(d.nameEn).toBe("Sara");
  });
});

import type { Metadata } from "next";
import { isValidInviteToken } from "@/lib/team/inviteLink";
import { JoinTeamForm } from "@/components/sections/join-team/JoinTeamForm";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function JoinTeamPage({
  params,
}: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = await params;
  const t = await getTranslations({ locale, namespace: "joinTeam" });
  const valid = await isValidInviteToken(token);
  if (!valid) {
    return (
      <main className="max-w-xl mx-auto px-6 py-24 text-center">
        <h1 className="font-serif text-2xl mb-3">{t("inactiveTitle")}</h1>
        <p className="text-text-secondary">{t("inactiveBody")}</p>
      </main>
    );
  }
  return <JoinTeamForm locale={locale} token={token} />;
}

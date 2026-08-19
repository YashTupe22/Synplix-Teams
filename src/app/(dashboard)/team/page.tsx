import { requirePermission, Permission } from "@/lib/authorization-server";
import { getTeamMembers } from "./actions";
import { TeamPageContent } from "./team-page-content";

export default async function TeamPage() {
  const profile = await requirePermission(Permission.USERS_VIEW);
  const { data: members } = await getTeamMembers();

  return (
    <TeamPageContent members={members ?? []} currentUser={profile} />
  );
}

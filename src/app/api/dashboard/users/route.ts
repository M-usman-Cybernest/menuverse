import { NextResponse } from "next/server";

import { createTeamMember, listTeamMembers } from "@/lib/menuverse-data";
import { getOptionalSession } from "@/lib/session";
import { createTeamMemberSchema } from "@/lib/validation";

export async function GET() {
  const session = await getOptionalSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const users = await listTeamMembers(session);

  return NextResponse.json({ users }, { status: 200 });
}

export async function POST(request: Request) {
  const session = await getOptionalSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const json = await request.json();
    const payload = createTeamMemberSchema.parse(json);
    await createTeamMember(session, payload);
    const users = await listTeamMembers(session);

    return NextResponse.json({ users }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Could not create user.",
      },
      { status: 400 },
    );
  }
}

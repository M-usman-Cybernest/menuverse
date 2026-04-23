import { NextResponse } from "next/server";

import { getRestaurantDatasetBySlug } from "@/lib/menuverse-data";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_: Request, { params }: RouteContext) {
  const { slug } = await params;
  const dataset = await getRestaurantDatasetBySlug(slug);

  if (!dataset) {
    return NextResponse.json({ message: "Restaurant not found." }, { status: 404 });
  }

  return NextResponse.json(dataset, { status: 200 });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return NextResponse.json(
        {
          status: "error",
          message: "Supabase connection failed",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "ok",
      message: "Supabase connection successful",
      session: data.session ? "active" : "none",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to initialize Supabase client",
        error: message,
      },
      { status: 500 }
    );
  }
}

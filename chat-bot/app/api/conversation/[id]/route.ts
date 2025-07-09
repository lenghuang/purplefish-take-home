import { type NextRequest, NextResponse } from "next/server";

// In a real app, this would connect to your database
// For demo purposes, we'll return mock data
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // In a real implementation, you'd fetch from your database
    // For now, return a basic structure
    return NextResponse.json({
      messages: [
        {
          id: "1",
          role: "assistant",
          content:
            "Hello! Are you currently open to discussing this nursing position with us today?",
        },
      ],
      state: {
        stage: "greeting",
        completed: false,
      },
    });
  } catch (error) {
    console.error("Failed to load conversation:", error);
    return NextResponse.json(
      { error: "Failed to load conversation" },
      { status: 500 },
    );
  }
}

import { json } from "@sveltejs/kit";

export const GET = async () => {
  return json(
    {
      status: "healthy",
      timestamp: Date.now(),
    },
    { status: 200 },
  );
};

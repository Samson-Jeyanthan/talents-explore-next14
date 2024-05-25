export const getLanguages = async () => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/language`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch language data");
    }

    const data = await response.json();
    return {
      data: data.response,
      status: data.status,
    };
  } catch (error) {
    console.error("Error fetching language data:", error);
    throw new Error("Couldn't fetch language data");
  }
};

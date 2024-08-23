"use server";

export const userPublicInfoAction = async (
  userId: string | undefined,
  viewerId: string | undefined
) => {
  try {
    // const response = await axiosInstance.get(`/user/${userId}`);
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/public/${userId}/${viewerId}`
    );
    return await response.json();
  } catch (error) {
    console.error(error);
    return error;
  }
};

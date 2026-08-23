const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "" : 'http://localhost:5000');

// Professional avatar fallback with black theme
export const getAvatarUrl = (user) => {
  if (user?.gender?.toLowerCase() === 'female') {
    return '/avatars/female.png';
  }
  return '/avatars/male.png';
};

export default API_BASE;

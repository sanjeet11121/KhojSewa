import { FaStar } from "react-icons/fa";

export default function StarRating({ rating }) {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);
  return (
    <div className="flex space-x-1 text-sm md:text-base">
      {stars.map((star) => (
        <FaStar
          key={star}
          className={star <= rating ? "text-yellow-400" : "text-gray-300"}
        />
      ))}
    </div>
  );
}

import Link from "next/link";
import { MessageSquarePlus } from "lucide-react";

export function InquiryButton({ productId, productName }: { productId: string; productName: string }) {
  return (
    <Link
      href={`/inquiry?productId=${productId}&productName=${encodeURIComponent(productName)}`}
      className="btn-primary"
    >
      <MessageSquarePlus className="h-4 w-4" /> Request Quotation
    </Link>
  );
}

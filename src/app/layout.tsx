import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "TripTube AI",
  description:
    "유튜브·블로그에 흩어진 여행 정보를 AI가 대신 검색·정리해서 완성된 여행 일정을 만들어주는 웹앱",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="ko">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}

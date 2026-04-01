import type { Metadata } from 'next';
import { Header } from '../src/components/Header';
import { Footer } from '../src/components/Footer';
import { HeroSection } from '../src/sections/HeroSection';
import { FeaturesSection } from '../src/sections/FeaturesSection';
import { StatsSection } from '../src/sections/StatsSection';
import { TestimonialsSection } from '../src/sections/TestimonialsSection';
import { CTASection } from '../src/sections/CTASection';

export const metadata: Metadata = {
  // title.template from root layout makes this "Home | NodeStarter"
  title: 'Home',
  description:
    'Ship faster with the ultimate full-stack starter — Next.js 14, NestJS, PostgreSQL, Redis, and Cloudinary, all wired up and ready to deploy.',
  openGraph: {
    title: 'NodeStarter — Production-ready full-stack template',
    description:
      'Ship faster with the ultimate full-stack starter — Next.js 14, NestJS, PostgreSQL, Redis, and Cloudinary, all wired up and ready to deploy.',
    url: '/',
  },
};

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <StatsSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}

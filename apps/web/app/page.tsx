import '../styles/home.css';
import { Header } from '../src/components/Header';
import { Footer } from '../src/components/Footer';
import { HeroSection } from '../src/sections/HeroSection';
import { FeaturesSection } from '../src/sections/FeaturesSection';
import { StatsSection } from '../src/sections/StatsSection';
import { TestimonialsSection } from '../src/sections/TestimonialsSection';
import { CTASection } from '../src/sections/CTASection';

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

<script setup lang="ts">
import { useScrollReveal } from '../composables/useScrollReveal'
import { useVideoAutoplay } from '../composables/useVideoAutoplay'
import HeroSection from '../components/sections/HeroSection.vue'
import TaskIntroSection from '../components/sections/TaskIntroSection.vue'
import AboutSection from '../components/sections/AboutSection.vue'
import TracksSection from '../components/sections/TracksSection.vue'
import PrizesSection from '../components/sections/PrizesSection.vue'
import ScheduleSection from '../components/sections/ScheduleSection.vue'
import QualifiedSection from '../components/sections/QualifiedSection.vue'
import FinalResultsSection from '../components/sections/FinalResultsSection.vue'
import JudgingSection from '../components/sections/JudgingSection.vue'
import TeamsSection from '../components/sections/TeamsSection.vue'
import FaqSection from '../components/sections/FaqSection.vue'
import SponsorsSection from '../components/sections/SponsorsSection.vue'
import CtaSection from '../components/sections/CtaSection.vue'

useScrollReveal()
useVideoAutoplay()
</script>

<template>
  <!-- Safari banner disabled -->
  <main>
    <HeroSection />
    <TaskIntroSection />
    <AboutSection />
    <ScheduleSection />
    <QualifiedSection />
    <FinalResultsSection />
    <PrizesSection />
    <JudgingSection />
    <TeamsSection />
    <TracksSection />
    <SponsorsSection />
    <FaqSection />
    <CtaSection />
  </main>
</template>

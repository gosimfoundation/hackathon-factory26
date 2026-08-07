<script setup lang="ts">
import { provideI18n } from './composables/useI18n'
import { provideAuth } from './composables/useAuth'
import { provideTheme } from './composables/useTheme'
import AppHeader from './components/layout/AppHeader.vue'
import AppFooter from './components/layout/AppFooter.vue'
import AnnouncementBanner from './components/effects/AnnouncementBanner.vue'
import InvitationsModal from './components/effects/InvitationsModal.vue'
import UnderConstructionModal from './components/effects/UnderConstructionModal.vue'

const { pick } = provideI18n()
provideAuth(pick)
provideTheme()
</script>

<template>
  <AppHeader />
  <AnnouncementBanner />
  <router-view />
  <AppFooter />
  <InvitationsModal />
  <UnderConstructionModal />
</template>

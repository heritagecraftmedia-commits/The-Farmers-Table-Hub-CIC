import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { FogProvider } from './context/FogContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { FeedbackBookPrompt } from './components/FeedbackBookPrompt';
import { RadioPlayerProvider } from './context/RadioPlayerContext';
import { MiniPlayer } from './components/radio/MiniPlayer';
import { RADIO_STAFF_ROLES } from './auth/radioAccess';
import { RequireRole } from './components/RequireRole';
import { ScrollToTop } from './components/ScrollToTop';

// Eager: the landing page and the 404. Everything a first-time visitor is most
// likely to hit should not wait on a second network round trip.
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';

// Everything else is split out. The whole site previously shipped as one
// ~1.3 MB chunk, so a visitor reading the About page also downloaded the
// founder dashboard, the Command Centre and every radio admin screen. This is
// a public community site where most traffic is mobile.
const Directory = lazy(() => import('./pages/Directory').then(m => ({ default: m.Directory })));
const Radio = lazy(() => import('./pages/Radio').then(m => ({ default: m.Radio })));
const RadioControl = lazy(() => import('./pages/RadioControl').then(m => ({ default: m.RadioControl })));
const RadioLibraryManager = lazy(() => import('./components/central/RadioLibraryManager').then(m => ({ default: m.RadioLibraryManager })));
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const Join = lazy(() => import('./pages/Join').then(m => ({ default: m.Join })));
const Resources = lazy(() => import('./pages/Resources').then(m => ({ default: m.Resources })));
const Marketplace = lazy(() => import('./pages/Marketplace').then(m => ({ default: m.Marketplace })));
const MakersHub = lazy(() => import('./pages/MakersHub').then(m => ({ default: m.MakersHub })));
const Cafe = lazy(() => import('./pages/Cafe').then(m => ({ default: m.Cafe })));
const Volunteer = lazy(() => import('./pages/Volunteer').then(m => ({ default: m.Volunteer })));
const Members = lazy(() => import('./pages/Members').then(m => ({ default: m.Members })));
const Feedback = lazy(() => import('./pages/Feedback').then(m => ({ default: m.Feedback })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Signup = lazy(() => import('./pages/Signup').then(m => ({ default: m.Signup })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const WhatsOn = lazy(() => import('./pages/WhatsOn').then(m => ({ default: m.WhatsOn })));
const MakerStories = lazy(() => import('./pages/MakerStories').then(m => ({ default: m.MakerStories })));
const ClaimListing = lazy(() => import('./pages/ClaimListing').then(m => ({ default: m.ClaimListing })));
const SubmitStory = lazy(() => import('./pages/SubmitStory').then(m => ({ default: m.SubmitStory })));
const MakersShop = lazy(() => import('./pages/MakersShop').then(m => ({ default: m.MakersShop })));
const Privacy = lazy(() => import('./pages/Privacy').then(m => ({ default: m.Privacy })));
const Terms = lazy(() => import('./pages/Terms').then(m => ({ default: m.Terms })));
const Accessibility = lazy(() => import('./pages/Accessibility').then(m => ({ default: m.Accessibility })));
const CommandCenter = lazy(() => import('./pages/CommandCenter').then(m => ({ default: m.CommandCenter })));
const Subscriptions = lazy(() => import('./pages/Subscriptions').then(m => ({ default: m.Subscriptions })));
const ChangesDraft = lazy(() => import('./pages/ChangesDraft').then(m => ({ default: m.ChangesDraft })));
const MakersDirectory = lazy(() => import('./pages/MakersDirectory').then(m => ({ default: m.MakersDirectory })));
const SupportMakers = lazy(() => import('./pages/SupportMakers').then(m => ({ default: m.SupportMakers })));
const BecomeAMaker = lazy(() => import('./pages/BecomeAMaker').then(m => ({ default: m.BecomeAMaker })));
const Notes = lazy(() => import('./pages/Notes').then(m => ({ default: m.Notes })));
const ProjectGuide = lazy(() => import('./pages/guides/ProjectGuide').then(m => ({ default: m.ProjectGuide })));
const DraftSpace = lazy(() => import('./pages/DraftSpace').then(m => ({ default: m.DraftSpace })));
const WhatsOnAgent = lazy(() => import('./pages/WhatsOnAgent'));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const Apply = lazy(() => import('./pages/Apply').then(m => ({ default: m.Apply })));
const MembersArea = lazy(() => import('./pages/MembersArea').then(m => ({ default: m.MembersArea })));
const CommunityRadio = lazy(() => import('./pages/CommunityRadio').then(m => ({ default: m.CommunityRadio })));
const Community = lazy(() => import('./pages/Community').then(m => ({ default: m.Community })));

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Shown while a route's chunk downloads. Sized to the viewport so the footer
// does not jump up the page mid-navigation.
const RouteFallback: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-label="Loading page">
    <div className="w-8 h-8 border-2 border-brand-olive/30 border-t-brand-olive rounded-full animate-spin" />
  </div>
);

const STAFF = ['founder', 'staff'] as const;
const RadioHome = lazy(() => import('./pages/radio/RadioHome').then(m => ({ default: m.RadioHome })));
const RadioSchedule = lazy(() => import('./pages/radio/RadioSchedule').then(m => ({ default: m.RadioSchedule })));
const RadioShows = lazy(() => import('./pages/radio/RadioShows').then(m => ({ default: m.RadioShows })));
const RadioProgrammeDetail = lazy(() => import('./pages/radio/RadioShows').then(m => ({ default: m.RadioProgrammeDetail })));
const RadioPresenters = lazy(() => import('./pages/radio/RadioPresenters').then(m => ({ default: m.RadioPresenters })));
const RadioPresenterDetail = lazy(() => import('./pages/radio/RadioPresenters').then(m => ({ default: m.RadioPresenterDetail })));
const RadioListenAgain = lazy(() => import('./pages/radio/RadioListenAgain').then(m => ({ default: m.RadioListenAgain })));
const RadioGetInvolved = lazy(() => import('./pages/radio/RadioGetInvolved').then(m => ({ default: m.RadioGetInvolved })));
const RadioSearch = lazy(() => import('./pages/radio/RadioSearch').then(m => ({ default: m.RadioSearch })));
const RadioAdvertise = lazy(() => import('./pages/radio/RadioAdvertise').then(m => ({ default: m.RadioAdvertise })));

// Radio access has ONE definition, in src/auth/radioAccess.ts, mirroring the
// database's is_radio_staff(). The list that used to sit here --
// ['founder','radio_manager','staff','presenter'] -- was stale: 20260828
// migrated every 'staff'/'presenter' profile to 'contributor' and its check
// constraint no longer permits either, so the list admitted nobody it named
// beyond founder and radio_manager, and omitted 'admin' and 'contributor'.
const RADIO_STAFF = RADIO_STAFF_ROLES;

export default function App() {
  return (
    <AuthProvider>
      <FogProvider>
        <Router>
          <ScrollToTop />
          <RadioPlayerProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  {/* Public */}
                  <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
                  <Route path="/directory" element={<PageWrapper><Directory /></PageWrapper>} />
                  {/* Radio -- listener facing. RadioHome (V3: stationService,
                      schedule engine, player) owns /radio. The earlier V1 page
                      is preserved at /radio/overview rather than deleted. */}
                  <Route path="/radio" element={<PageWrapper><RadioHome /></PageWrapper>} />
                  <Route path="/radio/overview" element={<PageWrapper><Radio /></PageWrapper>} />
                  <Route path="/radio/schedule" element={<PageWrapper><RadioSchedule /></PageWrapper>} />
                  <Route path="/radio/shows" element={<PageWrapper><RadioShows /></PageWrapper>} />
                  <Route path="/radio/shows/:slug" element={<PageWrapper><RadioProgrammeDetail /></PageWrapper>} />
                  <Route path="/radio/presenters" element={<PageWrapper><RadioPresenters /></PageWrapper>} />
                  <Route path="/radio/presenters/:slug" element={<PageWrapper><RadioPresenterDetail /></PageWrapper>} />
                  <Route path="/radio/listen-again" element={<PageWrapper><RadioListenAgain /></PageWrapper>} />
                  <Route path="/radio/get-involved" element={<PageWrapper><RadioGetInvolved /></PageWrapper>} />
                  <Route path="/radio/search" element={<PageWrapper><RadioSearch /></PageWrapper>} />
                  <Route path="/radio/advertise" element={<PageWrapper><RadioAdvertise /></PageWrapper>} />
                  <Route path="/marketplace" element={<PageWrapper><Marketplace /></PageWrapper>} />
                  <Route path="/makers-hub" element={<PageWrapper><MakersHub /></PageWrapper>} />
                  <Route path="/cafe" element={<PageWrapper><Cafe /></PageWrapper>} />
                  <Route path="/volunteer" element={<PageWrapper><Volunteer /></PageWrapper>} />
                  <Route path="/members" element={<PageWrapper><Members /></PageWrapper>} />
                  <Route path="/feedback" element={<PageWrapper><Feedback /></PageWrapper>} />
                  <Route path="/about" element={<PageWrapper><About /></PageWrapper>} />
                  <Route path="/join" element={<PageWrapper><Join /></PageWrapper>} />
                  <Route path="/resources" element={<PageWrapper><Resources /></PageWrapper>} />
                  <Route path="/whats-on" element={<PageWrapper><WhatsOn /></PageWrapper>} />
                  <Route path="/maker-stories" element={<PageWrapper><MakerStories /></PageWrapper>} />
                  <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
                  <Route path="/signup" element={<PageWrapper><Signup /></PageWrapper>} />
                  <Route path="/claim/:id" element={<PageWrapper><ClaimListing /></PageWrapper>} />
                  <Route path="/submit-story" element={<PageWrapper><SubmitStory /></PageWrapper>} />
                  <Route path="/makers-shop" element={<PageWrapper><MakersShop /></PageWrapper>} />
                  <Route path="/privacy" element={<PageWrapper><Privacy /></PageWrapper>} />
                  <Route path="/terms" element={<PageWrapper><Terms /></PageWrapper>} />
                  <Route path="/accessibility" element={<PageWrapper><Accessibility /></PageWrapper>} />
                  <Route path="/subscriptions" element={<Subscriptions />} />
                  <Route path="/makers" element={<PageWrapper><MakersDirectory /></PageWrapper>} />
                  <Route path="/support-the-makers" element={<PageWrapper><SupportMakers /></PageWrapper>} />
                  <Route path="/become-a-maker" element={<PageWrapper><BecomeAMaker /></PageWrapper>} />
                  <Route path="/guides/:guideId" element={<PageWrapper><ProjectGuide /></PageWrapper>} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/community" element={<PageWrapper><Community /></PageWrapper>} />
                  <Route path="/apply" element={<PageWrapper><Apply /></PageWrapper>} />
                  <Route path="/members-area" element={<PageWrapper><MembersArea /></PageWrapper>} />
                  <Route path="/community-radio" element={<PageWrapper><CommunityRadio /></PageWrapper>} />

                  {/* Staff and founder. Dashboard, CommandCenter and RadioControl
                      also guard internally; RequireRole stops the chunk loading
                      and the failing queries firing in the first place. */}
                  <Route path="/dashboard" element={<RequireRole roles={[...STAFF]}><PageWrapper><Dashboard /></PageWrapper></RequireRole>} />
                  <Route path="/command" element={<RequireRole roles={[...STAFF]}><PageWrapper><CommandCenter /></PageWrapper></RequireRole>} />
                  <Route path="/notes" element={<RequireRole roles={[...STAFF]}><PageWrapper><Notes /></PageWrapper></RequireRole>} />
                  <Route path="/draft" element={<RequireRole roles={[...STAFF]}><PageWrapper><DraftSpace /></PageWrapper></RequireRole>} />
                  <Route path="/changes" element={<RequireRole roles={[...STAFF]}><ChangesDraft /></RequireRole>} />
                  <Route path="/whats-on-agent" element={<RequireRole roles={[...STAFF]}><WhatsOnAgent /></RequireRole>} />

                  {/* Radio staff */}
                  <Route path="/radio/control" element={<RequireRole roles={RADIO_STAFF}><PageWrapper><RadioControl /></PageWrapper></RequireRole>} />
                  <Route path="/radio/library" element={<RequireRole roles={RADIO_STAFF}><PageWrapper><RadioLibraryManager /></PageWrapper></RequireRole>} />

                  <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
            <FeedbackBookPrompt />
            <MiniPlayer />
          </div>
          </RadioPlayerProvider>
        </Router>
      </FogProvider>
    </AuthProvider>
  );
}

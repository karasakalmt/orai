# Orai Frontend - Sprint Backlog

## Current Sprint: Sprint 1 (Week 1)
**Sprint Goal:** Set up development environment and basic Web3 integration
**Start Date:** November 21, 2024
**End Date:** November 28, 2024

### In Progress

### To Do
- [ ] Create UI components library
  - Points: 5
  - Priority: High

- [ ] Set up React Router
  - Points: 2
  - Priority: Medium

### Done
- [x] Project repository created
- [x] Documentation reviewed (PRD, FRONTEND.md)
- [x] Development tasks planned
- [x] Initialize React project with Vite ✅
  - Points: 3
  - Completed: Nov 21, 2024

- [x] Configure TypeScript with strict mode ✅
  - Points: 2
  - Completed: Nov 21, 2024

- [x] Install and configure TailwindCSS ✅
  - Points: 2
  - Completed: Nov 21, 2024

- [x] Create basic component structure ✅
  - Points: 3
  - Completed: Nov 21, 2024

- [x] Set up environment variables ✅
  - Points: 1
  - Completed: Nov 21, 2024

- [x] Create Postman API collection ✅
  - Points: 3
  - Completed: Nov 21, 2024

- [x] Set up RainbowKit with 0G testnet ✅
  - Points: 5
  - Completed: Nov 21, 2024
  - Configured custom 0G chain
  - Integrated Wagmi and React Query

- [x] Implement wallet connection button ✅
  - Points: 3
  - Completed: Nov 21, 2024
  - Created ConnectButton component
  - Added wallet info display
  - Implemented useWeb3 hook

### Sprint Metrics
- **Total Points:** 22 (19 original + 3 for Postman)
- **Completed:** 22 points ✅
- **Remaining:** 0 points (Sprint Goal Achieved!)
- **Velocity:** 22 points (100% completion)
- **Additional Work Planned:** UI Component Library (5 points)

---

## Sprint 2 (Week 2) - Planned
**Sprint Goal:** Complete UI component library and basic pages

### Backlog
- [ ] Create Button component with all variants - 2 points
- [ ] Create Card component - 2 points
- [ ] Create Input component with validation - 3 points
- [ ] Create Modal component - 3 points
- [ ] Implement Header with navigation - 5 points
- [ ] Create Home page layout - 5 points
- [ ] Set up React Router - 2 points
- [ ] Configure ESLint and Prettier - 2 points

**Total Points:** 24

---

## Sprint 3 (Week 3) - Planned
**Sprint Goal:** Implement question submission flow

### Backlog
- [ ] Create question submission form - 5 points
- [ ] Integrate React Hook Form - 3 points
- [ ] Add Zod validation schemas - 3 points
- [ ] Implement fee calculator - 5 points
- [ ] Connect to Oracle smart contract - 8 points
- [ ] Create submission confirmation UI - 3 points
- [ ] Add error handling - 3 points

**Total Points:** 30

---

## Product Backlog (Prioritized)

### Epic: Core Oracle Functionality
1. **Question Submission System** (Priority: 1)
   - Form implementation
   - Validation logic
   - Smart contract integration
   - Fee calculation
   - Confirmation flow

2. **Answer Display System** (Priority: 2)
   - Answer retrieval from contract
   - Evidence display
   - Confidence visualization
   - Proof viewer component

3. **Voting Mechanism** (Priority: 3)
   - Voting interface
   - Stake management
   - Vote submission
   - Results display
   - Reward claiming

### Epic: User Experience
4. **User Dashboard** (Priority: 4)
   - Submission history
   - Voting history
   - Rewards tracker
   - Statistics

5. **Browse & Discovery** (Priority: 5)
   - Question list
   - Filtering
   - Search
   - Pagination

### Epic: Real-time Features
6. **WebSocket Integration** (Priority: 6)
   - Connection management
   - Event handlers
   - Auto-reconnection
   - Status indicators

7. **Notifications** (Priority: 7)
   - Answer ready alerts
   - Voting reminders
   - Reward notifications

### Epic: Analytics
8. **Platform Statistics** (Priority: 8)
   - Charts and graphs
   - Historical data
   - Export functionality

### Epic: Developer Tools
9. **Documentation Site** (Priority: 9)
   - API docs
   - Integration guides
   - Code examples

### Epic: Performance & Polish
10. **Optimization** (Priority: 10)
    - Code splitting
    - Lazy loading
    - Bundle optimization
    - Caching strategies

---

## Technical Debt Log

### High Priority
- [ ] Add proper TypeScript types for all components
- [ ] Implement proper error boundaries
- [ ] Add loading states to all async operations

### Medium Priority
- [ ] Refactor duplicate code in form components
- [ ] Optimize re-renders in list components
- [ ] Improve accessibility (ARIA labels)

### Low Priority
- [ ] Add Storybook for component documentation
- [ ] Implement component visual regression tests
- [ ] Add performance monitoring

---

## Definition of Done

A task is considered DONE when:
1. ✅ Code is written and working
2. ✅ Unit tests are written and passing
3. ✅ Code is reviewed by another developer
4. ✅ Documentation is updated
5. ✅ No console errors or warnings
6. ✅ Responsive on mobile and desktop
7. ✅ Accessibility standards met
8. ✅ Merged to main branch

---

## Velocity Tracking

| Sprint | Points Planned | Points Completed | Velocity |
|--------|---------------|------------------|----------|
| 1      | 19            | TBD              | TBD      |
| 2      | 24            | -                | -        |
| 3      | 30            | -                | -        |

**Average Velocity:** TBD

---

## Impediments & Blockers

### Current Blockers
1. **0G Testnet RPC endpoints** - Need stable endpoints for development
   - Impact: Cannot test wallet connections
   - Owner: DevOps team
   - ETA: 2 days

2. **Smart Contract ABIs** - Waiting for final contract deployment
   - Impact: Cannot integrate contract calls
   - Owner: Smart contract team
   - ETA: 1 week

### Resolved Blockers
- None yet

---

## Team Notes

### Daily Standup Template
- What did you complete yesterday?
- What will you work on today?
- Any blockers or impediments?

### Sprint Retrospective Topics
- What went well?
- What could be improved?
- Action items for next sprint

### Communication Channels
- Daily Standup: 9:00 AM
- Sprint Planning: Mondays
- Sprint Review: Fridays
- Slack: #orai-frontend
- GitHub: Issues and PRs

---

**Last Updated:** November 21, 2024
**Sprint Master:** TBD
**Product Owner:** TBD
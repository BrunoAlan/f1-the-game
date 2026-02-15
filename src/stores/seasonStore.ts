import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  RDUpgrades,
  RDArea,
  RDBranch,
  ComponentState,
  ComponentType,
  Sponsor,
  DriverStanding,
  TeamStanding,
} from '../data/types'
import { drivers } from '../data/drivers'
import { teams } from '../data/teams'
import { sponsorPool } from '../data/sponsors'
import { rdTree } from '../data/rdTree'
import { replaceComponent, COMPONENT_REPLACEMENT_COSTS } from '../engine/seasonEngine'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pickRandomSponsors(excludeIds: string[], count: number): Sponsor[] {
  const available = sponsorPool.filter((s) => !excludeIds.includes(s.id))
  // Fisher-Yates shuffle on a copy
  const shuffled = [...available]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, count).map((s) => ({
    ...s,
    racesRemaining: s.duration,
  }))
}

// ---------------------------------------------------------------------------
// Default values
// ---------------------------------------------------------------------------

const defaultRDUpgrades: RDUpgrades = {
  motor: { base: false, branch: null },
  aero: { base: false, branch: null },
  chasis: { base: false, branch: null },
  pitcrew: { base: false, branch: null },
}

const defaultComponents: ComponentState[] = [
  { type: 'engine', healthPercent: 100, racesUsed: 0 },
  { type: 'gearbox', healthPercent: 100, racesUsed: 0 },
  { type: 'energy-recovery', healthPercent: 100, racesUsed: 0 },
]

function makeInitialDriverStandings(): DriverStanding[] {
  return drivers.map((d) => ({ driverId: d.id, points: 0, positions: [] }))
}

function makeInitialTeamStandings(): TeamStanding[] {
  return teams.map((t) => ({ teamId: t.id, points: 0 }))
}

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

interface SeasonState {
  seasonActive: boolean
  currentRaceIndex: number
  driverStandings: DriverStanding[]
  teamStandings: TeamStanding[]
  budget: number
  researchPoints: number
  rdUpgrades: RDUpgrades
  components: ComponentState[]
  activeSponsors: Sponsor[]
  availableSponsors: Sponsor[]

  // Actions
  startSeason: () => void
  advanceToNextRace: () => void
  purchaseBaseUpgrade: (area: RDArea) => boolean
  purchaseBranchUpgrade: (area: RDArea, branch: RDBranch) => boolean
  replaceComponentAction: (type: ComponentType) => boolean
  setComponents: (components: ComponentState[]) => void
  signSponsor: (sponsorId: string) => boolean
  dropSponsor: (sponsorId: string) => void
  refreshAvailableSponsors: () => void
  addRaceResults: (results: {
    driverPositions: { driverId: string; position: number; dnf: boolean }[]
    prizeMoney: number
    sponsorPayouts: number
    rp: number
    pointsPerDriver: { driverId: string; points: number }[]
  }) => void
  reset: () => void
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSeasonStore = create<SeasonState>()(
  persist(
    (set, get) => ({
      seasonActive: false,
      currentRaceIndex: 0,
      driverStandings: makeInitialDriverStandings(),
      teamStandings: makeInitialTeamStandings(),
      budget: 10_000_000,
      researchPoints: 0,
      rdUpgrades: { ...defaultRDUpgrades },
      components: defaultComponents.map((c) => ({ ...c })),
      activeSponsors: [],
      availableSponsors: [],

      // -------------------------------------------------------------------------
      // startSeason
      // -------------------------------------------------------------------------
      startSeason: () => {
        const available = pickRandomSponsors([], 4)
        set({
          seasonActive: true,
          currentRaceIndex: 0,
          driverStandings: makeInitialDriverStandings(),
          teamStandings: makeInitialTeamStandings(),
          budget: 10_000_000,
          researchPoints: 0,
          rdUpgrades: {
            motor: { base: false, branch: null },
            aero: { base: false, branch: null },
            chasis: { base: false, branch: null },
            pitcrew: { base: false, branch: null },
          },
          components: defaultComponents.map((c) => ({ ...c })),
          activeSponsors: [],
          availableSponsors: available,
        })
      },

      // -------------------------------------------------------------------------
      // advanceToNextRace
      // -------------------------------------------------------------------------
      advanceToNextRace: () => {
        const state = get()
        // Decrement racesRemaining on active sponsors, remove expired
        const updatedSponsors = state.activeSponsors
          .map((s) => ({ ...s, racesRemaining: s.racesRemaining - 1 }))
          .filter((s) => s.racesRemaining > 0)

        const excludeIds = updatedSponsors.map((s) => s.id)
        const newAvailable = pickRandomSponsors(excludeIds, 4)

        set({
          currentRaceIndex: state.currentRaceIndex + 1,
          activeSponsors: updatedSponsors,
          availableSponsors: newAvailable,
        })
      },

      // -------------------------------------------------------------------------
      // purchaseBaseUpgrade
      // -------------------------------------------------------------------------
      purchaseBaseUpgrade: (area) => {
        const state = get()
        const upgrade = state.rdUpgrades[area]
        if (upgrade.base) return false

        const node = rdTree[area].base
        if (state.budget < node.costMoney || state.researchPoints < node.costRP) {
          return false
        }

        set({
          budget: state.budget - node.costMoney,
          researchPoints: state.researchPoints - node.costRP,
          rdUpgrades: {
            ...state.rdUpgrades,
            [area]: { ...upgrade, base: true },
          },
        })
        return true
      },

      // -------------------------------------------------------------------------
      // purchaseBranchUpgrade
      // -------------------------------------------------------------------------
      purchaseBranchUpgrade: (area, branch) => {
        const state = get()
        const upgrade = state.rdUpgrades[area]

        // Must have base first
        if (!upgrade.base) return false
        // Must not already have a branch
        if (upgrade.branch !== null) return false

        const branchNode = branch === 'a' ? rdTree[area].branches[0] : rdTree[area].branches[1]

        if (state.budget < branchNode.costMoney || state.researchPoints < branchNode.costRP) {
          return false
        }

        set({
          budget: state.budget - branchNode.costMoney,
          researchPoints: state.researchPoints - branchNode.costRP,
          rdUpgrades: {
            ...state.rdUpgrades,
            [area]: { ...upgrade, branch },
          },
        })
        return true
      },

      // -------------------------------------------------------------------------
      // replaceComponentAction
      // -------------------------------------------------------------------------
      replaceComponentAction: (type) => {
        const state = get()
        const cost = COMPONENT_REPLACEMENT_COSTS[type]
        if (state.budget < cost) return false

        set({
          budget: state.budget - cost,
          components: replaceComponent(state.components, type),
        })
        return true
      },

      // -------------------------------------------------------------------------
      // setComponents
      // -------------------------------------------------------------------------
      setComponents: (components) => set({ components }),

      // -------------------------------------------------------------------------
      // signSponsor
      // -------------------------------------------------------------------------
      signSponsor: (sponsorId) => {
        const state = get()
        if (state.activeSponsors.length >= 3) return false

        const sponsor = state.availableSponsors.find((s) => s.id === sponsorId)
        if (!sponsor) return false

        set({
          activeSponsors: [...state.activeSponsors, sponsor],
          availableSponsors: state.availableSponsors.filter((s) => s.id !== sponsorId),
        })
        return true
      },

      // -------------------------------------------------------------------------
      // dropSponsor
      // -------------------------------------------------------------------------
      dropSponsor: (sponsorId) => {
        const state = get()
        set({
          activeSponsors: state.activeSponsors.filter((s) => s.id !== sponsorId),
        })
      },

      // -------------------------------------------------------------------------
      // refreshAvailableSponsors
      // -------------------------------------------------------------------------
      refreshAvailableSponsors: () => {
        const state = get()
        const excludeIds = state.activeSponsors.map((s) => s.id)
        set({
          availableSponsors: pickRandomSponsors(excludeIds, 4),
        })
      },

      // -------------------------------------------------------------------------
      // addRaceResults
      // -------------------------------------------------------------------------
      addRaceResults: (results) => {
        const state = get()

        // Update driver standings
        const updatedDriverStandings = state.driverStandings.map((ds) => {
          const driverResult = results.driverPositions.find((dp) => dp.driverId === ds.driverId)
          const driverPoints = results.pointsPerDriver.find((pp) => pp.driverId === ds.driverId)

          if (!driverResult) return ds

          return {
            ...ds,
            points: ds.points + (driverPoints?.points ?? 0),
            positions: [...ds.positions, driverResult.position],
          }
        })

        // Update team standings: sum points from both team drivers
        const updatedTeamStandings = state.teamStandings.map((ts) => {
          const teamDriverIds = drivers.filter((d) => d.teamId === ts.teamId).map((d) => d.id)

          const teamPoints = results.pointsPerDriver
            .filter((pp) => teamDriverIds.includes(pp.driverId))
            .reduce((sum, pp) => sum + pp.points, 0)

          return {
            ...ts,
            points: ts.points + teamPoints,
          }
        })

        // Budget: add prize money + sponsor payouts (entry fee already deducted externally or included in prizeMoney calc)
        const newBudget = state.budget + results.prizeMoney + results.sponsorPayouts

        set({
          driverStandings: updatedDriverStandings,
          teamStandings: updatedTeamStandings,
          budget: newBudget,
          researchPoints: state.researchPoints + results.rp,
        })
      },

      // -------------------------------------------------------------------------
      // reset
      // -------------------------------------------------------------------------
      reset: () =>
        set({
          seasonActive: false,
          currentRaceIndex: 0,
          driverStandings: makeInitialDriverStandings(),
          teamStandings: makeInitialTeamStandings(),
          budget: 10_000_000,
          researchPoints: 0,
          rdUpgrades: {
            motor: { base: false, branch: null },
            aero: { base: false, branch: null },
            chasis: { base: false, branch: null },
            pitcrew: { base: false, branch: null },
          },
          components: defaultComponents.map((c) => ({ ...c })),
          activeSponsors: [],
          availableSponsors: [],
        }),
    }),
    { name: 'f1-game-season' },
  ),
)

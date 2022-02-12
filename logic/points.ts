import {
  buildSpecialtyIds,
  excludingBuildSpecialtyTrackIds,
  Milestone,
  MilestoneMap,
  milestones,
  SpecialtyId,
  TrackId,
  trackIds,
} from "../constants/tracks";

import {
  DEFAULT_MILESTONE_POINT_MAP,
  TRACK_WEIGHT_MAP,
} from "../constants/points/configure";
import { getTracksWithSpecialties } from "./tracks";
import { include } from "./utils";

export function totalPointsFromMilestoneMap(
  milestoneMap: MilestoneMap,
  specialties: SpecialtyId[] = [],
  ids: TrackId[] = trackIds
): number {
  const specialtyPoints = sumSpecialtyPoints(
    milestoneMap,
    specialties,
    include(buildSpecialtyIds, ids)
  );

  const mainTrackPoints = sumPoints(
    milestoneMap,
    include(excludingBuildSpecialtyTrackIds, ids)
  );

  return mainTrackPoints + specialtyPoints;
}

function sumSpecialtyPoints(
  milestoneMap: MilestoneMap,
  specialties: SpecialtyId[] = [],
  ids: TrackId[] = buildSpecialtyIds
) {
  let specialtyTrackIds = getTracksWithSpecialties(specialties, ids);
  const specialtyMilestonePoints = specialtyTrackIds.map((id) =>
    milestoneToPoints(milestoneMap[id], id)
  );

  return specialtyMilestonePoints
    .map((m, index) => m * (diminishReturn[index] || 0)) // diminish return
    .reduce((sum, added) => sum + added, 0);
}
const diminishReturn = [1, 0.5, 0.25];

function sumPoints(milestoneMap: MilestoneMap, ids: TrackId[]) {
  return ids
    .map((id) => milestoneToPoints(milestoneMap[id], id))
    .reduce((sum, added) => sum + added, 0);
}

export function trackToMilestoneArray(trackId: TrackId) {
  const trackWeight = TRACK_WEIGHT_MAP?.[trackId] ?? 1;
  if (typeof trackWeight === "number") {
    return DEFAULT_MILESTONE_POINT_MAP.map((points) => points * trackWeight);
  } else {
    return trackWeight;
  }
}

export function milestoneToPoints(
  milestone: Milestone,
  trackId: TrackId
): number {
  return trackMilestonePoints?.[trackId]?.[milestone] ?? 0;
}

export const trackMilestonePoints = Object.fromEntries(
  trackIds?.map((id) => [id, trackToMilestoneArray(id)]) ?? []
);

/**
 *
 * @param tracksAtMilestones an array of number representing the number of tracks at milestone skipping milestone 0
 *
 * eg: someone with  craft at 1 and communication at 1, leadership at 1 and web at 2 would call
 * estimateMinPoints(3, 1)
 *
 * @returns
 */
export function estimateMinPoints(...tracksAtMilestones: number[]) {
  return Math.floor(
    tracksAtMilestones.reduce(
      (acc, count, milestone) =>
        acc +
        (count % trackIds?.length ?? 1) *
          (averageTrackMilestonePoints[milestone] || 0),
      0
    )
  );
}

export const averageTrackMilestonePoints = averageTrackPoints();

export function averageTrackPoints() {
  return (
    milestones
      ?.map((m) => {
        return avg(
          excludingBuildSpecialtyTrackIds.map((tid) =>
            milestoneToPoints(m, tid)
          )
        );
      })
      .slice(1) ?? []
  );
}

function avg(array) {
  return (
    array.reduce((acc, value) => acc + value, 0) / array.filter(Boolean).length
  );
}
